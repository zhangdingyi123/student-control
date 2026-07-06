const { v4: uuidv4 } = require('uuid');
const defaultPlan = require('./plan');
const platform = require('./platform');
const studyLinks = require('./studyLinks');

function getTotalItems(plan) {
  if (!plan?.days) return 0;
  return plan.days.reduce((sum, d) => sum + (d.items?.length || 0), 0);
}

function calcProgress(plan, checks) {
  const total = getTotalItems(plan);
  let done = 0;
  if (!plan?.days) return { done, total, percent: 0 };
  plan.days.forEach(day => {
    (day.items || []).forEach(item => {
      if (checks?.[item.id]) done++;
    });
  });
  return { done, total, percent: total ? Math.round(done / total * 100) : 0 };
}

function dayProgress(plan, checks) {
  return (plan?.days || []).map(d => {
    const total = d.items?.length || 0;
    const done = (d.items || []).filter(i => checks?.[i.id]).length;
    return {
      id: d.id,
      title: d.title,
      done,
      total,
      percent: total ? Math.round(done / total * 100) : 0
    };
  });
}

function getTags() {
  return platform.getTags();
}

function normalizePlan(input, existingPlan) {
  const cfg = platform.readConfig();
  const planName = (input.planName || existingPlan?.planName || '未命名计划').trim();
  const startDate = input.startDate !== undefined ? input.startDate : (existingPlan?.startDate || '');
  const description = input.description !== undefined ? input.description : (existingPlan?.description || '');
  const className = input.className !== undefined ? input.className : (existingPlan?.className || '');

  const days = (input.days || existingPlan?.days || []).map((day, di) => {
    const dayId = day.id?.trim() || `d${di + 1}`;
    const items = (day.items || [])
      .map((item, ii) => ({
        id: item.id?.trim() || `${dayId}-${ii + 1}`,
        text: (item.text || '').trim(),
        tag: platform.normalizeTag(item.tag, cfg),
        ref: item.ref || '',
        link: (item.link || '').trim(),
        libraryId: item.libraryId || ''
      }))
      .filter(i => i.text);
    return {
      id: dayId,
      title: (day.title || `D${di + 1}`).trim(),
      items
    };
  });
  return {
    planName,
    startDate: startDate || null,
    description: description || '',
    className: className || '',
    totalDays: days.length,
    days
  };
}

function pruneChecks(plan, checks) {
  const valid = new Set();
  (plan?.days || []).forEach(d => (d.items || []).forEach(i => valid.add(i.id)));
  const pruned = {};
  Object.keys(checks || {}).forEach(k => {
    if (valid.has(k)) pruned[k] = true;
  });
  return pruned;
}

function cloneDefaultPlan() {
  return JSON.parse(JSON.stringify(defaultPlan));
}

function migrateStore(store) {
  if (!store.plans) store.plans = [];
  if (!store.activePlanId && store.plans.length === 0) {
    const tpl = cloneDefaultPlan();
    const id = uuidv4();
    store.plans.push({
      id,
      ...normalizePlan(tpl),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    store.activePlanId = id;
  }
  if (!store.activePlanId && store.plans.length > 0) {
    store.activePlanId = store.plans[0].id;
  }
  store.students = (store.students || []).map(s => ({
    planId: s.planId || null,
    ...s
  }));
  return store;
}

function getPlanById(store, planId) {
  return store.plans.find(p => p.id === planId);
}

function getActivePlan(store) {
  return getPlanById(store, store.activePlanId) || store.plans[0] || null;
}

function getStudentPlan(store, student) {
  if (student?.planId) {
    const p = getPlanById(store, student.planId);
    if (p) return p;
  }
  return getActivePlan(store);
}

/** 学员日历起始日：个人 > 计划开课日 > 注册日 */
function getPlanStartDate(store, student) {
  const plan = getStudentPlan(store, student);
  if (student?.planStartDate) return student.planStartDate;
  if (plan?.startDate) return plan.startDate;
  if (student?.createdAt) return student.createdAt.split('T')[0];
  return new Date().toISOString().split('T')[0];
}

function tagStats(plan) {
  const stats = {};
  (plan?.days || []).forEach(d => (d.items || []).forEach(i => {
    const t = i.tag || '学习';
    stats[t] = (stats[t] || 0) + 1;
  }));
  return stats;
}

function planPayload(p, { forStudent = false } = {}) {
  if (!p) return null;
  const plan = forStudent ? studyLinks.enrichPlan(p) : p;
  return {
    id: plan.id,
    planName: plan.planName,
    startDate: plan.startDate || null,
    description: plan.description || '',
    className: plan.className || '',
    totalDays: plan.totalDays ?? plan.days?.length ?? 0,
    days: plan.days,
    tagStats: tagStats(plan),
    updatedAt: plan.updatedAt
  };
}

module.exports = {
  getTags,
  getTotalItems,
  calcProgress,
  dayProgress,
  normalizePlan,
  pruneChecks,
  cloneDefaultPlan,
  migrateStore,
  getPlanById,
  getActivePlan,
  getStudentPlan,
  getPlanStartDate,
  tagStats,
  planPayload
};
