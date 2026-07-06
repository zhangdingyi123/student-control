const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const pu = require('./planUtils');
const platform = require('./platform');
const domains = require('./domains');
const content = require('./content');
const alerts = require('./alerts');
const resources = require('./resources');
const hot100 = require('./hot100');
const lcUrls = require('./lcUrls');
const studyLinks = require('./studyLinks');

const app = express();
const PORT = process.env.PORT || 3847;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'teacher123';

app.set('trust proxy', true);
app.use(express.json({ limit: '2mb' }));
app.use(domains.domainRouter);
app.use(express.static(path.join(__dirname, '../public')));

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ students: [], sessions: {}, plans: [], activePlanId: null }, null, 2));
  }
}

function readStore() {
  ensureDataFile();
  const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const migrated = pu.migrateStore(store);
  if (JSON.stringify(migrated) !== JSON.stringify(store)) {
    writeStore(migrated);
  }
  return migrated;
}

function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function hashToken() {
  return crypto.randomBytes(24).toString('hex');
}

function findStudent(store, id) {
  return store.students.find(s => s.id === id);
}

function authStudent(req, store) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const session = store.sessions[token];
  if (!session || session.role !== 'student') return null;
  if (Date.now() > session.expiresAt) return null;
  return findStudent(store, session.studentId);
}

function authTeacher(req, store) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const session = store.sessions[token];
  if (!session || session.role !== 'teacher') return null;
  if (Date.now() > session.expiresAt) return null;
  return true;
}

function studentSummary(store, student, avgProgress) {
  const plan = pu.getStudentPlan(store, student);
  const checks = student.checks || {};
  const planStartDate = pu.getPlanStartDate(store, student);
  const progress = pu.calcProgress(plan, checks);
  const avg = avgProgress ?? (
    store.students.length
      ? Math.round(store.students.reduce((s, x) => {
        const p = pu.getStudentPlan(store, x);
        return s + pu.calcProgress(p, x.checks || {}).percent;
      }, 0) / store.students.length)
      : 0
  );
  return {
    id: student.id,
    name: student.name,
    batch: student.batch || '',
    planId: student.planId || null,
    planName: plan?.planName || '无计划',
    planStartDate,
    pin: student.pin || '',
    teacherNote: student.teacherNote || '',
    teacherNoteAt: student.teacherNoteAt || null,
    checks,
    progress,
    dayProgress: pu.dayProgress(plan, checks),
    alert: alerts.computeAlert(store, student, progress, avg),
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    lastCheckIn: student.lastCheckIn || null
  };
}

// --- Content (分册阅读) ---
app.get('/api/content/volumes', (req, res) => {
  res.json({ volumes: content.listVolumes() });
});

app.get('/api/content/:id', (req, res) => {
  const store = readStore();
  const student = authStudent(req, store);
  const teacher = authTeacher(req, store);
  if (!student && !teacher) return res.status(401).json({ error: '请先登录' });
  const vol = content.readVolume(req.params.id);
  if (!vol) return res.status(404).json({ error: '资料不存在' });
  res.json(vol);
});

// --- 外链资料库 ---
app.get('/api/student/resources', (req, res) => {
  const store = readStore();
  if (!authStudent(req, store)) return res.status(401).json({ error: '请先登录' });
  const cfg = platform.readConfig();
  const list = cfg.externalResources?.length
    ? cfg.externalResources
    : resources.listExternalResources();
  res.json({ resources: list, hot100Count: hot100.list().length });
});

// 力扣题号 → 题目页（Hot 100 + 补充题）
app.get('/api/lc-slugs', (_req, res) => {
  res.json({ slugs: lcUrls.slugMap() });
});

// --- Platform config (public) ---
app.get('/api/config', (_req, res) => {
  const cfg = platform.readConfig();
  const dom = domains.getDomainConfig();
  res.json({
    platformName: cfg.platformName,
    platformSubtitle: cfg.platformSubtitle,
    defaultTag: cfg.defaultTag,
    tags: platform.getTags(cfg),
    domains: dom
  });
});

// --- Public plan (active default) ---
app.get('/api/plan', (_req, res) => {
  const store = readStore();
  const p = pu.getActivePlan(store);
  res.json(pu.planPayload(p) || { planName: '暂无计划', days: [] });
});

// --- Student ---
app.post('/api/student/register', (req, res) => {
  const { name, pin } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: '请输入姓名' });
  const store = readStore();
  const trimmed = name.trim();
  if (store.students.find(s => s.name === trimmed)) {
    return res.status(409).json({ error: '该姓名已注册，请直接登录' });
  }
  const student = {
    id: uuidv4(),
    name: trimmed,
    pin: pin || '',
    planId: null,
    checks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheckIn: null
  };
  store.students.push(student);
  const token = hashToken();
  store.sessions[token] = { role: 'student', studentId: student.id, expiresAt: Date.now() + 30 * 24 * 3600 * 1000 };
  writeStore(store);
  res.json({ token, student: studentSummary(store, student), plan: pu.planPayload(pu.getStudentPlan(store, student), { forStudent: true }) });
});

app.post('/api/student/login', (req, res) => {
  const { name, pin } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: '请输入姓名' });
  const store = readStore();
  const student = store.students.find(s => s.name === name.trim());
  if (!student) return res.status(404).json({ error: '学员不存在，请先注册' });
  if (student.pin && student.pin !== (pin || '')) return res.status(401).json({ error: 'PIN 码错误' });
  const token = hashToken();
  store.sessions[token] = { role: 'student', studentId: student.id, expiresAt: Date.now() + 30 * 24 * 3600 * 1000 };
  writeStore(store);
  res.json({ token, student: studentSummary(store, student), plan: pu.planPayload(pu.getStudentPlan(store, student), { forStudent: true }) });
});

app.get('/api/student/me', (req, res) => {
  const store = readStore();
  const student = authStudent(req, store);
  if (!student) return res.status(401).json({ error: '未登录或会话过期' });
  const plan = pu.getStudentPlan(store, student);
  res.json({ ...studentSummary(store, student), plan: pu.planPayload(plan, { forStudent: true }) });
});

app.get('/api/student/me/plan', (req, res) => {
  const store = readStore();
  const student = authStudent(req, store);
  if (!student) return res.status(401).json({ error: '未登录或会话过期' });
  res.json(pu.planPayload(pu.getStudentPlan(store, student), { forStudent: true }));
});

app.put('/api/student/me/progress', (req, res) => {
  const store = readStore();
  const student = authStudent(req, store);
  if (!student) return res.status(401).json({ error: '未登录或会话过期' });
  const idx = store.students.findIndex(s => s.id === student.id);
  if (idx === -1) return res.status(404).json({ error: '学员不存在' });

  const plan = pu.getStudentPlan(store, student);
  const { checks, itemId, checked } = req.body || {};
  let newChecks = { ...(store.students[idx].checks || {}) };

  if (checks && typeof checks === 'object') {
    newChecks = checks;
  } else if (itemId) {
    if (checked) newChecks[itemId] = true;
    else delete newChecks[itemId];
  }
  store.students[idx].checks = pu.pruneChecks(plan, newChecks);
  store.students[idx].updatedAt = new Date().toISOString();
  store.students[idx].lastCheckIn = new Date().toISOString();
  writeStore(store);
  res.json(studentSummary(store, store.students[idx]));
});

app.post('/api/student/logout', (req, res) => {
  const store = readStore();
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && store.sessions[token]) {
    delete store.sessions[token];
    writeStore(store);
  }
  res.json({ ok: true });
});

// --- Teacher auth ---
app.post('/api/teacher/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== TEACHER_PASSWORD) return res.status(401).json({ error: '教师密码错误' });
  const store = readStore();
  const token = hashToken();
  store.sessions[token] = { role: 'teacher', expiresAt: Date.now() + 7 * 24 * 3600 * 1000 };
  writeStore(store);
  res.json({ token });
});

// --- Teacher: plans ---
app.get('/api/teacher/plans', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  res.json({
    activePlanId: store.activePlanId,
    plans: store.plans.map(p => ({
      id: p.id,
      planName: p.planName,
      className: p.className || '',
      startDate: p.startDate || null,
      totalDays: p.days?.length || 0,
      itemCount: pu.getTotalItems(p),
      studentCount: store.students.filter(s => {
        const sp = pu.getStudentPlan(store, s);
        return sp?.id === p.id;
      }).length,
      updatedAt: p.updatedAt,
      isActive: p.id === store.activePlanId
    })),
    tags: pu.getTags()
  });
});

app.get('/api/teacher/plans/:id', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const p = pu.getPlanById(store, req.params.id);
  if (!p) return res.status(404).json({ error: '计划不存在' });
  res.json({ ...pu.planPayload(p), isActive: p.id === store.activePlanId });
});

app.post('/api/teacher/plans', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const normalized = pu.normalizePlan(req.body || {});
  const plan = {
    id: uuidv4(),
    ...normalized,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.plans.push(plan);
  if (!store.activePlanId) store.activePlanId = plan.id;
  writeStore(store);
  res.json(pu.planPayload(plan));
});

app.post('/api/teacher/plans/import-default', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const tpl = pu.cloneDefaultPlan();
  const plan = {
    id: uuidv4(),
    ...pu.normalizePlan(tpl),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.plans.push(plan);
  writeStore(store);
  res.json(pu.planPayload(plan));
});

app.put('/api/teacher/plans/:id', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const idx = store.plans.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '计划不存在' });
  const normalized = pu.normalizePlan(req.body, store.plans[idx]);
  store.plans[idx] = {
    ...store.plans[idx],
    ...normalized,
    updatedAt: new Date().toISOString()
  };
  store.students.forEach((s, si) => {
    const sp = pu.getStudentPlan(store, s);
    if (sp?.id === req.params.id) {
      store.students[si].checks = pu.pruneChecks(store.plans[idx], s.checks);
    }
  });
  writeStore(store);
  res.json(pu.planPayload(store.plans[idx]));
});

app.put('/api/teacher/plans/:id/activate', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const plan = pu.getPlanById(store, req.params.id);
  if (!plan) return res.status(404).json({ error: '计划不存在' });
  store.activePlanId = req.params.id;
  writeStore(store);
  res.json({ ok: true, activePlanId: store.activePlanId });
});

/** 将计划开课日同步给使用该计划的学员（清除个人覆盖日） */
app.post('/api/teacher/plans/:id/sync-start', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const plan = pu.getPlanById(store, req.params.id);
  if (!plan) return res.status(404).json({ error: '计划不存在' });
  if (!plan.startDate) return res.status(400).json({ error: '请先设置计划开课日期' });
  let count = 0;
  store.students.forEach((s, i) => {
    const sp = pu.getStudentPlan(store, s);
    if (sp?.id === plan.id) {
      store.students[i].planStartDate = null;
      count++;
    }
  });
  writeStore(store);
  res.json({ ok: true, synced: count, startDate: plan.startDate });
});

app.get('/api/teacher/presets', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const cfg = platform.readConfig();
  res.json({
    externalResources: cfg.externalResources || resources.listExternalResources(),
    libraries: cfg.libraries || [],
    volumes: platform.allLibraryItems(cfg),
    taskPresets: cfg.taskPresets || [],
    planTemplates: cfg.planTemplates || [],
    tags: platform.getTags(cfg),
    defaultTag: cfg.defaultTag
  });
});

app.post('/api/teacher/plans/:id/duplicate', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const src = pu.getPlanById(store, req.params.id);
  if (!src) return res.status(404).json({ error: '计划不存在' });
  const body = req.body || {};
  const normalized = pu.normalizePlan({
    planName: body.planName || `${src.planName}（副本）`,
    startDate: '',
    description: src.description,
    className: '',
    days: JSON.parse(JSON.stringify(src.days))
  });
  const plan = {
    id: uuidv4(),
    ...normalized,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.plans.push(plan);
  writeStore(store);
  res.json(pu.planPayload(plan));
});

app.delete('/api/teacher/plans/:id', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  if (store.plans.length <= 1) return res.status(400).json({ error: '至少保留一个计划' });
  if (store.activePlanId === req.params.id) return res.status(400).json({ error: '不能删除当前默认计划，请先切换默认' });
  const inUse = store.students.some(s => s.planId === req.params.id);
  if (inUse) return res.status(400).json({ error: '有学员正在使用该计划，请先改派' });
  store.plans = store.plans.filter(p => p.id !== req.params.id);
  writeStore(store);
  res.json({ ok: true });
});

// --- Teacher: students ---
app.get('/api/teacher/students', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const active = pu.getActivePlan(store);
  const batchFilter = req.query.batch;
  let pool = store.students;
  if (batchFilter === '__none__') pool = pool.filter(s => !s.batch);
  else if (batchFilter) pool = pool.filter(s => (s.batch || '') === batchFilter);

  const avgProgress = pool.length
    ? Math.round(pool.reduce((s, x) => {
      const p = pu.getStudentPlan(store, x);
      return s + pu.calcProgress(p, x.checks || {}).percent;
    }, 0) / pool.length)
    : 0;

  const list = pool.map(s => studentSummary(store, s, avgProgress))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const batches = [...new Set(store.students.map(s => s.batch).filter(Boolean))].sort();
  const stats = {
    totalStudents: list.length,
    avgProgress,
    activeToday: list.filter(s => {
      if (!s.lastCheckIn) return false;
      return new Date(s.lastCheckIn).toDateString() === new Date().toDateString();
    }).length,
    behindCount: list.filter(s => s.alert?.level === 'warning').length
  };
  res.json({
    stats,
    students: list,
    batches,
    planName: active?.planName || '暂无默认计划',
    activePlanId: store.activePlanId,
    plans: store.plans.map(p => ({
      id: p.id,
      planName: p.planName,
      startDate: p.startDate || null,
      totalDays: p.days?.length || 0
    }))
  });
});

app.post('/api/teacher/students', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const { name, pin, planId, planStartDate, batch } = req.body || {};
  const trimmed = name?.trim();
  if (!trimmed) return res.status(400).json({ error: '请输入学员姓名' });
  if (store.students.find(s => s.name === trimmed)) {
    return res.status(409).json({ error: '该姓名已存在' });
  }
  if (planId && !pu.getPlanById(store, planId)) {
    return res.status(404).json({ error: '计划不存在' });
  }
  const student = {
    id: uuidv4(),
    name: trimmed,
    pin: pin || '',
    batch: (batch || '').trim(),
    planId: planId || null,
    planStartDate: planStartDate || null,
    teacherNote: '',
    checks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheckIn: null
  };
  store.students.push(student);
  writeStore(store);
  res.status(201).json(studentSummary(store, student));
});

app.put('/api/teacher/students/:id', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const idx = store.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '学员不存在' });
  const { name, pin, planId, planStartDate, resetProgress, batch } = req.body || {};
  const trimmed = name?.trim();
  if (trimmed) {
    const dup = store.students.find(s => s.name === trimmed && s.id !== req.params.id);
    if (dup) return res.status(409).json({ error: '该姓名已被其他学员使用' });
    store.students[idx].name = trimmed;
  }
  if (pin !== undefined) store.students[idx].pin = pin || '';
  if (planId !== undefined) {
    if (planId && !pu.getPlanById(store, planId)) {
      return res.status(404).json({ error: '计划不存在' });
    }
    store.students[idx].planId = planId || null;
  }
  if (planStartDate !== undefined) {
    store.students[idx].planStartDate = planStartDate || null;
  }
  if (batch !== undefined) store.students[idx].batch = (batch || '').trim();
  if (resetProgress) store.students[idx].checks = {};
  const plan = pu.getStudentPlan(store, store.students[idx]);
  store.students[idx].checks = pu.pruneChecks(plan, store.students[idx].checks);
  store.students[idx].updatedAt = new Date().toISOString();
  writeStore(store);
  res.json(studentSummary(store, store.students[idx]));
});

app.put('/api/teacher/students/:id/note', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const idx = store.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '学员不存在' });
  const { note } = req.body || {};
  store.students[idx].teacherNote = (note || '').trim();
  store.students[idx].teacherNoteAt = store.students[idx].teacherNote
    ? new Date().toISOString()
    : null;
  store.students[idx].updatedAt = new Date().toISOString();
  writeStore(store);
  res.json(studentSummary(store, store.students[idx]));
});

app.put('/api/teacher/students/:id/plan', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const idx = store.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '学员不存在' });
  const { planId, planStartDate } = req.body || {};
  if (planId && !pu.getPlanById(store, planId)) return res.status(404).json({ error: '计划不存在' });
  store.students[idx].planId = planId || null;
  if (planStartDate !== undefined) {
    store.students[idx].planStartDate = planStartDate || null;
  }
  const plan = pu.getStudentPlan(store, store.students[idx]);
  store.students[idx].checks = pu.pruneChecks(plan, store.students[idx].checks);
  store.students[idx].updatedAt = new Date().toISOString();
  writeStore(store);
  res.json(studentSummary(store, store.students[idx]));
});

app.delete('/api/teacher/students/:id', (req, res) => {
  const store = readStore();
  if (!authTeacher(req, store)) return res.status(401).json({ error: '教师未登录' });
  const idx = store.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '学员不存在' });
  store.students = store.students.filter(s => s.id !== req.params.id);
  Object.keys(store.sessions).forEach(tok => {
    const sess = store.sessions[tok];
    if (sess.role === 'student' && sess.studentId === req.params.id) {
      delete store.sessions[tok];
    }
  });
  writeStore(store);
  res.json({ ok: true });
});

// 旧地址兼容跳转
app.get('/student.html', (_req, res) => res.redirect(302, '/student/app.html'));
app.get('/teacher.html', (_req, res) => res.redirect(302, '/teacher/dashboard.html'));
app.get('/teacher-plan.html', (_req, res) => res.redirect(302, '/teacher/plan.html'));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

ensureDataFile();
app.listen(PORT, () => {
  console.log(`\n📚 学习计划平台已启动`);
  const dom = domains.getDomainConfig();
  console.log(`   本地学员: http://localhost:${PORT}/student/`);
  console.log(`   本地教师: http://localhost:${PORT}/teacher/`);
  if (dom.studentDomain || dom.teacherDomain) {
    console.log(`   ── 线上域名（需 Nginx 反代到 :${PORT}）──`);
    if (dom.studentDomain) {
      console.log(`   学员端:   ${dom.studentUrl || dom.studentDomain}/student/`);
    }
    if (dom.teacherDomain) {
      console.log(`   教师端:   ${dom.teacherUrl || dom.teacherDomain}/teacher/`);
    }
  }
  console.log(`   教师默认密码: ${TEACHER_PASSWORD}`);
  console.log(`   修改密码: TEACHER_PASSWORD=xxx npm start\n`);
});
