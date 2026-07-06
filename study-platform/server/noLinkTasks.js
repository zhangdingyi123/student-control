/** 无需外链的任务：八股/复习/STAR 等，仅打卡；算法等保留外链 */

const NO_LINK_TAGS = new Set(['八股', '复盘', '项目', '冲刺', '模拟']);

const NO_LINK_TEXT = [
  /star/i,
  /复盘/,
  /复习/,
  /过各分册/,
  /各分册「/,
  /过面试题合集/,
  /过错题|只看错题/,
  /自问自答/,
  /完整讲述/,
  /早睡/,
  /梳理\s*\d+\s*个?项目/
];

function shouldSkipStudyLinks(item) {
  if (!item) return true;
  const tag = item.tag || '';
  const text = item.text || '';
  if (NO_LINK_TAGS.has(tag)) return true;
  return NO_LINK_TEXT.some(re => re.test(text));
}

module.exports = { shouldSkipStudyLinks, NO_LINK_TAGS, NO_LINK_TEXT };
