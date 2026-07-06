const pu = require('./planUtils');

const INACTIVE_DAYS = 2;
const BEHIND_SCHEDULE_GAP = 18;
const BELOW_AVG_GAP = 12;

function daysSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function expectedProgressPercent(store, student, plan) {
  const total = plan?.days?.length || 0;
  if (!total) return 0;
  const start = pu.getPlanStartDate(store, student);
  const startMs = new Date(start + 'T12:00:00').getTime();
  const todayMs = new Date().setHours(12, 0, 0, 0);
  const dayIndex = Math.floor((todayMs - startMs) / 86400000);
  if (dayIndex < 0) return 0;
  if (dayIndex >= total) return 100;
  return Math.round(((dayIndex + 1) / total) * 100);
}

function computeAlert(store, student, progress, avgProgress) {
  const reasons = [];
  const inactive = student.lastCheckIn
    ? daysSince(student.lastCheckIn)
    : daysSince(student.createdAt);

  if (inactive !== null && inactive >= INACTIVE_DAYS) {
    reasons.push(student.lastCheckIn ? `${inactive} 天未打卡` : '从未打卡');
  }

  if (store.students.length > 1 && progress.percent < avgProgress - BELOW_AVG_GAP) {
    reasons.push('进度低于班级均值');
  }

  const plan = pu.getStudentPlan(store, student);
  const expected = expectedProgressPercent(store, student, plan);
  if (expected > 10 && progress.percent < expected - BEHIND_SCHEDULE_GAP) {
    reasons.push(`课表应完成约 ${expected}%，当前 ${progress.percent}%`);
  }

  return {
    level: reasons.length ? 'warning' : 'ok',
    reasons
  };
}

module.exports = { computeAlert, expectedProgressPercent };
