#!/usr/bin/env node
/**
 * 为指定学员分配「Hot 100 全覆盖」课表（代码默认 plan.js，100 道 LC + 21 天八股）
 *
 * 用法：
 *   node scripts/assign-hot100-plan.js 俊萱
 *   node scripts/assign-hot100-plan.js 俊萱 张三 --set-default
 */
const { v4: uuidv4 } = require('uuid');
const { readStore, writeStore } = require('../db');
const pu = require('../planUtils');

const names = process.argv.slice(2).filter(a => !a.startsWith('--'));
const setDefault = process.argv.includes('--set-default');

if (!names.length) {
  console.error('用法: node scripts/assign-hot100-plan.js <学员姓名> [更多姓名...] [--set-default]');
  process.exit(1);
}

function lcCount(plan) {
  return (plan?.days || []).flatMap(d => d.items || []).filter(i => /^LC\s*\d+/.test(i.text || '')).length;
}

function ensureHot100Plan(store) {
  const tpl = pu.cloneDefaultPlan();
  const targetName = tpl.planName;
  const existing = store.plans.find(p => p.planName === targetName && lcCount(p) >= 100);

  if (existing) {
    const normalized = pu.normalizePlan(tpl, existing);
    Object.assign(existing, normalized, { updatedAt: new Date().toISOString() });
    return existing;
  }

  const plan = {
    id: uuidv4(),
    ...pu.normalizePlan(tpl),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.plans.push(plan);
  return plan;
}

const store = readStore();
const plan = ensureHot100Plan(store);
const lc = lcCount(plan);

if (setDefault) store.activePlanId = plan.id;

const results = [];
for (const name of names) {
  const student = store.students.find(s => s.name === name);
  if (!student) {
    results.push({ name, ok: false, error: '学员不存在' });
    continue;
  }
  student.planId = plan.id;
  student.checks = pu.pruneChecks(plan, student.checks || {});
  student.updatedAt = new Date().toISOString();
  results.push({ name, ok: true, planId: plan.id, keptChecks: Object.keys(student.checks).length });
}

writeStore(store);

console.log(`✅ 课表: ${plan.planName}`);
console.log(`   ${plan.days.length} 天 · ${lc} 道 LC · id=${plan.id}`);
if (setDefault) console.log('   已设为全班默认课表');

for (const r of results) {
  if (r.ok) {
    console.log(`✅ ${r.name} → 已分配（保留打卡 ${r.keptChecks} 项）`);
  } else {
    console.log(`❌ ${r.name}: ${r.error}`);
    process.exitCode = 1;
  }
}
