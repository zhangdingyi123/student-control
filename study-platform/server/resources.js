/** 外链资料库（小林 coding 等）与八股主题映射 */
const { linkForBaguTask, PREFIX_FALLBACK } = require('./baguLinks');

const EXTERNAL_RESOURCES = [
  { id: 'xl-home', name: '官网首页', url: 'https://xiaolincoding.com/', desc: '所有内容入口' },
  { id: 'xl-network', name: '图解网络', url: 'https://xiaolincoding.com/network/', desc: '20W 字 + 500 图' },
  { id: 'xl-os', name: '图解系统', url: 'https://xiaolincoding.com/os/', desc: '16W 字 + 400 图' },
  { id: 'xl-mysql', name: '图解 MySQL', url: 'https://xiaolincoding.com/mysql/', desc: '20W 字 + 320 图' },
  { id: 'xl-redis', name: '图解 Redis', url: 'https://xiaolincoding.com/redis/', desc: '图解 Redis' },
  { id: 'xl-interview', name: '面试题合集', url: 'https://xiaolincoding.com/interview/', desc: '22 套，约 40W 字' },
  { id: 'xl-backend', name: '大厂面经', url: 'https://xiaolincoding.com/backend_interview/', desc: '真实面经 + 解析' },
  { id: 'xl-github', name: 'GitHub', url: 'https://github.com/xiaolincoder/CS-Base', desc: '开源仓库' },
  { id: 'lc-hot100', name: 'LeetCode Hot 100', url: 'https://leetcode.cn/studyplan/top-100-liked/', desc: '面试最高命中率 · 100 题' },
  { id: 'lc-codetop', name: 'CodeTop', url: 'https://codetop.cc/', desc: '按公司查真题' }
];

const BAGU_PREFIX_LINK = { ...PREFIX_FALLBACK };

function linkForBaguPrefix(prefix) {
  return PREFIX_FALLBACK[prefix] || 'https://xiaolincoding.com/interview/';
}

function linkFromTaskText(text) {
  return linkForBaguTask(text);
}

function listExternalResources() {
  return EXTERNAL_RESOURCES;
}

module.exports = {
  EXTERNAL_RESOURCES,
  BAGU_PREFIX_LINK,
  linkForBaguPrefix,
  linkFromTaskText,
  linkForBaguTask,
  listExternalResources
};
