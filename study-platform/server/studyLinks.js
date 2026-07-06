/** 为课表任务生成 studyLinks（服务端统一解析，避免前端缓存导致多题只出一个链接） */
const lcUrls = require('./lcUrls');
const { resolveBaguLinks } = require('./baguLinks');
const { shouldSkipStudyLinks } = require('./noLinkTasks');

function parseLcNums(text) {
  if (!text) return [];
  const nums = [];
  for (const m of String(text).matchAll(/LC\s*(\d+)/gi)) {
    const n = Number(m[1]);
    if (!nums.includes(n)) nums.push(n);
  }
  for (const m of String(text).matchAll(/[、,，+／/]\s*(\d{1,4})(?=\s|[^\d]|$)/g)) {
    const n = Number(m[1]);
    if (n > 0 && !nums.includes(n)) nums.push(n);
  }
  return nums;
}

function enrichItem(item) {
  if (!item) return item;
  if (shouldSkipStudyLinks(item)) return item;

  const text = item.text || '';
  const lcNums = parseLcNums(text);

  if (lcNums.length > 1) {
    const studyLinks = lcNums
      .map(n => ({ label: `LC ${n} ›`, url: lcUrls.urlForNum(n) }))
      .filter(l => l.url);
    return studyLinks.length ? { ...item, studyLinks } : item;
  }

  if (lcNums.length === 1) {
    const url = item.link || lcUrls.urlForNum(lcNums[0]);
    return url ? { ...item, studyLinks: [{ label: '点击进入学习 ›', url }] } : item;
  }

  let url = item.link || null;
  if (!url && /hot\s*100/i.test(text)) url = 'https://leetcode.cn/studyplan/top-100-liked/';
  if (!url && /codetop/i.test(text)) url = 'https://codetop.cc/';

  const baguLinks = resolveBaguLinks(text);
  if (baguLinks.length) return { ...item, studyLinks: baguLinks };

  if (item.tag === '八股') {
    url = url || 'https://xiaolincoding.com/interview/';
  }
  return url ? { ...item, studyLinks: [{ label: '点击进入学习 ›', url }] } : item;
}

function enrichPlan(plan) {
  if (!plan?.days) return plan;
  return {
    ...plan,
    days: plan.days.map(day => ({
      ...day,
      items: (day.items || []).map(enrichItem)
    }))
  };
}

module.exports = { parseLcNums, enrichItem, enrichPlan, shouldSkipStudyLinks };
