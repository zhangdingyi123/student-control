#!/usr/bin/env node
/** 校验课表与力扣 slug 映射（本地 + 可选 HTTP） */
const https = require('https');
const hot100 = require('../hot100');
const lcUrls = require('../lcUrls');
const resources = require('../resources');
const plan = require('../plan');

const doHttp = process.argv.includes('--http');

function head(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 12000 }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
  });
}

async function main() {
  const issues = [];
  const map = lcUrls.slugMap();

  for (const p of hot100.list()) {
    const expected = `https://leetcode.cn/problems/${p.slug}/`;
    if (p.url !== expected) issues.push(`Hot100 #${p.num} url 不一致`);
    if (map[p.num] !== p.slug) issues.push(`Hot100 #${p.num} slug 映射缺失`);
  }

  for (const d of plan.days) {
    for (const it of d.items) {
      const m = it.text?.match(/^LC\s*(\d+)/i);
      if (m && it.link !== lcUrls.urlForNum(m[1])) {
        issues.push(`${d.id} ${it.text}: link 与 slug 不一致`);
      }
      const prefix = it.text?.match(/^(\d{2})\s/);
      if (prefix && it.tag === '八股' && it.link !== resources.linkForBaguPrefix(prefix[1])) {
        issues.push(`${d.id} ${it.text}: 八股 link 不一致`);
      }
    }
  }

  if (doHttp) {
    for (const [num, slug] of Object.entries(map)) {
      const code = await head(`https://leetcode.cn/problems/${slug}/`);
      if (code !== 200) issues.push(`HTTP ${code}: #${num} ${slug}`);
    }
    for (const url of [...new Set(Object.values(resources.BAGU_PREFIX_LINK))]) {
      const code = await head(url);
      if (code !== 200) issues.push(`HTTP ${code}: ${url}`);
    }
  }

  console.log(`映射条目: ${Object.keys(map).length}（Hot100 100 + 补充 ${Object.keys(lcUrls.EXTRA).length}）`);
  if (issues.length) {
    console.error('发现问题:');
    issues.forEach(i => console.error(' -', i));
    process.exit(1);
  }
  console.log(doHttp ? '本地 + HTTP 校验通过' : '本地校验通过（加 --http 可测外链）');
}

main();
