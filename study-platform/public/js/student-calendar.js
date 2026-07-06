if (!API.getToken('student')) location.href = '/student/';

let planData = null;
let checks = {};
let startDate = null;
let teacherNote = '';
let selectedPlanIndex = null;

/** 八股编号前缀 → 小林 coding 专题页 */
const BAGU_LINKS = {
  '06': 'https://xiaolincoding.com/mysql/',
  '07': 'https://xiaolincoding.com/redis/',
  '08': 'https://xiaolincoding.com/network/',
  '09': 'https://xiaolincoding.com/os/',
  '01': 'https://xiaolincoding.com/interview/',
  '02': 'https://xiaolincoding.com/interview/',
  '03': 'https://xiaolincoding.com/interview/',
  '04': 'https://xiaolincoding.com/interview/',
  '05': 'https://xiaolincoding.com/interview/',
  '10': 'https://xiaolincoding.com/interview/',
  '11': 'https://xiaolincoding.com/interview/',
  '12': 'https://xiaolincoding.com/interview/'
};

const LC_SLUGS = {
  217: 'contains-duplicate'
};

async function loadLcSlugs() {
  try {
    const data = await API.request('/api/lc-slugs');
    if (data.slugs) Object.assign(LC_SLUGS, data.slugs);
  } catch { /* 使用本地兜底 */ }
}

function parseLcNums(text) {
  if (!text) return [];
  const nums = [];
  for (const m of text.matchAll(/LC\s*(\d+)/gi)) {
    const n = Number(m[1]);
    if (!nums.includes(n)) nums.push(n);
  }
  for (const m of text.matchAll(/[、,，+／/]\s*(\d{1,4})(?=\s|[^\d]|$)/g)) {
    const n = Number(m[1]);
    if (n > 0 && !nums.includes(n)) nums.push(n);
  }
  return nums;
}

function lcUrl(num) {
  const slug = LC_SLUGS[num];
  return slug ? `https://leetcode.cn/problems/${slug}/` : null;
}

/** 复习 / STAR / 分册汇总等任务不跳转外链 */
function shouldSkipStudyLinks(item) {
  if (!item) return true;
  const tag = item.tag || '';
  const text = item.text || '';
  if (['八股', '复盘', '项目', '冲刺', '模拟'].includes(tag)) return true;
  return /star/i.test(text)
    || /复盘|复习/.test(text)
    || /过各分册|各分册「/.test(text)
    || /过面试题合集|过错题|只看错题/.test(text)
    || /自问自答|完整讲述|早睡/.test(text)
    || /梳理\s*\d+\s*个?项目/.test(text);
}

function inferLink(item) {
  if (shouldSkipStudyLinks(item)) return null;
  if (item.link) return item.link;
  const text = item.text || '';
  const lcNums = parseLcNums(text);
  if (lcNums.length === 1) return lcUrl(lcNums[0]);
  if (item.tag === '算法' && /hot\s*100/i.test(text)) {
    return 'https://leetcode.cn/studyplan/top-100-liked/';
  }
  if (item.tag === '算法' && /codetop/i.test(text)) return 'https://codetop.cc/';
  const prefix = text.match(/^(\d{2})\s/);
  if (prefix && BAGU_LINKS[prefix[1]]) return BAGU_LINKS[prefix[1]];
  return null;
}

/** 返回可点击的学习链接（优先用服务端下发的 studyLinks） */
function resolveStudyLinks(item) {
  if (!item) return [];
  if (shouldSkipStudyLinks(item)) return [];
  if (item.studyLinks?.length) return item.studyLinks;
  const text = item.text || '';
  const lcNums = parseLcNums(text);
  if (lcNums.length > 1) {
    return lcNums.map(n => ({ label: `LC ${n} ›`, url: lcUrl(n) })).filter(l => l.url);
  }
  if (lcNums.length === 1) {
    const url = item.link || lcUrl(lcNums[0]);
    return url ? [{ label: '点击进入学习 ›', url }] : [];
  }

  const url = inferLink(item);
  return url ? [{ label: '点击进入学习 ›', url }] : [];
}

function resolveStudyTarget(item) {
  const links = resolveStudyLinks(item);
  return links.length === 1 ? { type: 'link', url: links[0].url } : null;
}

function openStudy(itemId, e) {
  if (e) e.stopPropagation();
  const day = selectedPlanIndex !== null ? planData?.days?.[selectedPlanIndex] : null;
  const item = day?.items?.find(i => i.id === itemId);
  if (!item) return;
  const links = resolveStudyLinks(item);
  if (!links.length) {
    showToast('本任务暂无在线资料，完成学习后勾选左侧打卡');
    return;
  }
  window.open(links[0].url, '_blank', 'noopener');
}

function showToast(msg) {
  let el = document.getElementById('study-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'study-toast';
    el.className = 'study-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 2800);
}
let saveTimer = null;
let viewYear, viewMonth;

const RING_CIRCUMFERENCE = 2 * Math.PI * 52;

async function init() {
  try {
    await loadLcSlugs();
    const me = await API.request('/api/student/me', { headers: API.studentAuth() });
    planData = me.plan;
    checks = me.checks || {};
    teacherNote = me.teacherNote || '';
    startDate = startOfDay(new Date(me.planStartDate || me.createdAt || Date.now()));

    document.getElementById('user-name').textContent = me.name;
    document.getElementById('hero-name').textContent = me.name;
    document.getElementById('plan-name').textContent = planData?.planName || me.planName || '学习计划';

    const noteEl = document.getElementById('teacher-note-banner');
    if (noteEl) {
      if (teacherNote) {
        noteEl.style.display = 'block';
        noteEl.querySelector('.note-text').textContent = teacherNote;
      } else {
        noteEl.style.display = 'none';
      }
    }

    const days = planData?.days?.length || 0;
    const end = addDays(startDate, days - 1);
    document.getElementById('hero-meta').textContent =
      days ? `${formatDate(startDate)} 起 · 共 ${days} 天 · 至 ${formatDate(end)}` : '暂无学习任务';

    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();

    const todayIdx = getPlanIndexForDate(now);
    if (todayIdx !== null) selectedPlanIndex = todayIdx;

    renderAll();
  } catch (e) {
    API.setToken('student', null);
    location.href = '/student/';
  }
}

function renderAll() {
  renderStats();
  renderCalendar();
  if (selectedPlanIndex !== null) renderDayPanel(selectedPlanIndex);
  else renderEmptyPanel();
}

function renderStats() {
  const prog = calcProgress();
  document.getElementById('pct-num').textContent = prog.percent + '%';
  document.getElementById('stat-done').textContent = prog.done;
  document.getElementById('stat-total').textContent = prog.total;

  const ring = document.getElementById('ring-fill');
  ring.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - prog.percent / 100);

  const todayIdx = getPlanIndexForDate(new Date());
  if (todayIdx !== null) {
    const day = planData.days[todayIdx];
    const d = day.items.filter(i => checks[i.id]).length;
    document.getElementById('stat-today').textContent = `${d}/${day.items.length}`;
  } else {
    document.getElementById('stat-today').textContent = '—';
  }
}

function renderCalendar() {
  document.getElementById('cal-title').textContent =
    `${viewYear}年${viewMonth + 1}月`;

  const grid = document.getElementById('cal-grid');
  const first = new Date(viewYear, viewMonth, 1);
  const last = new Date(viewYear, viewMonth + 1, 0);
  let startPad = first.getDay() - 1;
  if (startPad < 0) startPad = 6;

  let html = '';
  for (let i = 0; i < startPad; i++) {
    html += '<div class="cal-cell empty"></div>';
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(viewYear, viewMonth, d);
    const planIdx = getPlanIndexForDate(date);
    const classes = ['cal-cell'];
    let dots = '';

    if (planIdx !== null) {
      classes.push('has-plan');
      const day = planData.days[planIdx];
      const done = day.items.filter(i => checks[i.id]).length;
      const total = day.items.length;
      if (done === total && total > 0) classes.push('done');
      else if (done > 0) classes.push('partial');
      if (planIdx === selectedPlanIndex) classes.push('selected');
      dots = day.items.map(i =>
        `<span class="cal-task-dot ${checks[i.id] ? 'on' : ''}"></span>`
      ).join('');
    }

    if (isSameDay(date, new Date())) classes.push('today');

    const planLabel = planIdx !== null ? `D${planIdx + 1}` : '';
    const click = planIdx !== null ? `onclick="selectDay(${planIdx})"` : '';

    html += `
      <div class="${classes.join(' ')}" ${click} data-plan="${planIdx ?? ''}">
        <span class="cal-day-num">${d}</span>
        ${planLabel ? `<span class="cal-plan-day">${planLabel}</span>` : ''}
        ${dots ? `<div class="cal-task-dots">${dots}</div>` : ''}
      </div>`;
  }

  grid.innerHTML = html;
}

function selectDay(planIdx) {
  selectedPlanIndex = planIdx;
  renderCalendar();
  renderDayPanel(planIdx);
}

function renderDayPanel(planIdx) {
  const day = planData.days[planIdx];
  const date = addDays(startDate, planIdx);
  const done = day.items.filter(i => checks[i.id]).length;
  const total = day.items.length;
  const pct = total ? Math.round(done / total * 100) : 0;

  document.getElementById('panel-label').textContent = `第 ${planIdx + 1} 天`;
  document.getElementById('panel-title').textContent = day.title.replace(/^D\d+\s*·\s*/, '') || day.title;
  document.getElementById('panel-date').textContent = formatDate(date, true);
  document.getElementById('panel-progress-text').textContent = `${done} / ${total} 已完成`;
  document.getElementById('panel-bar').style.width = pct + '%';

  const body = document.getElementById('panel-tasks');
  let html = '';
  if (done === total && total > 0) {
    html += '<div class="panel-complete-banner">🎉 今日任务已全部完成！</div>';
  }
  html += '<p class="panel-study-hint">点击任务进入学习 · 左侧勾选表示完成</p>';
  html += day.items.map(item => {
    const completed = !!checks[item.id];
    const tag = item.tag || '学习';
    const tagClass = 'tag-' + tag;
    const links = resolveStudyLinks(item);
    const studyable = links.length > 0;
    const multiLc = links.length > 1;
    const linksHtml = multiLc
      ? `<div class="task-lc-links">${links.map(l =>
          `<a href="${escapeAttr(l.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${escapeHtml(l.label)}</a>`
        ).join('')}</div>`
      : (studyable ? '<span class="task-enter-hint">点击进入学习 ›</span>' : '');
    return `
      <div class="task-card ${completed ? 'completed' : ''} ${studyable ? 'task-card-study' : ''}">
        <button type="button" class="task-check" aria-label="${completed ? '取消完成' : '标记完成'}"
          onclick="toggleTask('${item.id}', event)">${completed ? '✓' : ''}</button>
        <div class="task-content" ${studyable && !multiLc ? `onclick="openStudy('${item.id}', event)"` : ''}>
          <div class="task-text">${escapeHtml(item.text)}</div>
          <div class="task-meta">
            <span class="task-tag ${tagClass}">${escapeHtml(tag)}</span>
            ${linksHtml}
          </div>
        </div>
      </div>`;
  }).join('');
  body.innerHTML = html;
}

function renderEmptyPanel() {
  document.getElementById('panel-label').textContent = '学习日历';
  document.getElementById('panel-title').textContent = '选择日期查看任务';
  document.getElementById('panel-date').textContent = '';
  document.getElementById('panel-progress-text').textContent = '—';
  document.getElementById('panel-bar').style.width = '0%';
  document.getElementById('panel-tasks').innerHTML =
    '<p class="panel-empty">点击日历中标注了 D1、D2… 的日期，查看并打卡当日任务</p>';
}

function toggleTask(itemId, e) {
  if (e) e.stopPropagation();
  if (checks[itemId]) delete checks[itemId];
  else checks[itemId] = true;

  renderAll();
  setSyncState('pending');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(syncProgress, 400);
}

function changeMonth(delta) {
  viewMonth += delta;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  renderCalendar();
}

function goToday() {
  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth();
  const idx = getPlanIndexForDate(now);
  if (idx !== null) selectedPlanIndex = idx;
  renderAll();
}

function getPlanIndexForDate(date) {
  if (!planData?.days?.length || !startDate) return null;
  const d = startOfDay(date);
  const diff = Math.floor((d - startDate) / 86400000);
  if (diff < 0 || diff >= planData.days.length) return null;
  return diff;
}

function calcProgress() {
  let total = 0, done = 0;
  planData?.days?.forEach(d => d.items.forEach(i => {
    total++;
    if (checks[i.id]) done++;
  }));
  return { done, total, percent: total ? Math.round(done / total * 100) : 0 };
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDate(d, weekday) {
  const opts = { year: 'numeric', month: 'long', day: 'numeric' };
  if (weekday) opts.weekday = 'long';
  return d.toLocaleDateString('zh-CN', opts);
}

function escapeHtml(s) {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

function escapeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function setSyncState(state) {
  const dot = document.getElementById('sync-dot');
  const text = document.getElementById('sync-text');
  if (state === 'pending') {
    dot.className = 'sync-dot pending';
    text.textContent = '同步中…';
  } else if (state === 'error') {
    dot.className = 'sync-dot';
    dot.style.background = 'var(--danger)';
    text.textContent = '同步失败';
  } else {
    dot.className = 'sync-dot';
    dot.style.background = '';
    text.textContent = '已同步 · ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
}

async function syncProgress() {
  try {
    const data = await API.request('/api/student/me/progress', {
      method: 'PUT',
      headers: API.studentAuth(),
      body: JSON.stringify({ checks })
    });
    checks = data.checks;
    setSyncState('ok');
  } catch (e) {
    setSyncState('error');
  }
}

async function logout() {
  try {
    await API.request('/api/student/logout', { method: 'POST', headers: API.studentAuth() });
  } catch (_) {}
  API.setToken('student', null);
  API.setStudentName(null);
  location.href = '/student/';
}

init();
