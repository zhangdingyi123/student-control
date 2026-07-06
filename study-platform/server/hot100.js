/** LeetCode Hot 100 题单（100 题，按题型分组顺序） */
const PROBLEMS = require('./hot100-data.json');

function list() {
  return PROBLEMS;
}

function byNum(num) {
  return PROBLEMS.find(p => p.num === Number(num));
}

function urlForNum(num) {
  return byNum(num)?.url || `https://leetcode.cn/problemset/all/?search=${num}`;
}

function chunkBySize(items, size = 5) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function chunkPairs(items) {
  return chunkBySize(items, 2);
}

module.exports = { PROBLEMS, list, byNum, urlForNum, chunkPairs, chunkBySize };
