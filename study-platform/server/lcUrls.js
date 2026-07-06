/** 力扣题号 → slug 映射（Hot 100 + 课表可能出现的补充题） */
const hot100 = require('./hot100');

/** 非 Hot 100 但旧课表/补充题单可能出现的题 */
const EXTRA = {
  217: 'contains-duplicate'
};

function slugMap() {
  const map = { ...EXTRA };
  hot100.list().forEach(p => { map[p.num] = p.slug; });
  return map;
}

function urlForNum(num) {
  const n = Number(num);
  const slug = slugMap()[n];
  if (slug) return `https://leetcode.cn/problems/${slug}/`;
  return null;
}

module.exports = { slugMap, urlForNum, EXTRA };
