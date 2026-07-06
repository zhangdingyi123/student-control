/** 默认学习计划：21 天八股冲刺 + Hot 100 全覆盖（每天 5 题） */
const hot100 = require('./hot100');
const { linkForBaguTask } = require('./baguLinks');

const LC_PER_DAY = 5;
const BAGU_DAYS_COUNT = 21;
const LC_DAYS = Math.ceil(hot100.list().length / LC_PER_DAY);

const B = (text) => ({ link: linkForBaguTask(text) });
const bagu = (id, text) => ({ id, text, tag: '八股', ...B(text) });

const BAGU_DAYS = [
  { id: 'd1', title: 'D1 · MySQL 索引 + 项目启动', items: [
    bagu('d1-1', '06 MySQL 索引 + B+ 树'),
    bagu('d1-2', '06 最左匹配、覆盖索引、索引失效'),
    { id: 'd1-3', text: '梳理 1 个项目 STAR 故事（草稿）', tag: '项目' }
  ]},
  { id: 'd2', title: 'D2 · MySQL 事务', items: [
    bagu('d2-1', '06 事务 + 隔离级别'),
    bagu('d2-2', '06 MVCC + redo/undo/binlog'),
    { id: 'd2-3', text: 'STAR 故事补充量化数据', tag: '项目' }
  ]},
  { id: 'd3', title: 'D3 · MySQL 锁', items: [
    bagu('d3-1', '06 行锁/间隙锁/临键锁'),
    bagu('d3-2', '06 死锁排查思路')
  ]},
  { id: 'd4', title: 'D4 · Redis 基础', items: [
    bagu('d4-1', '07 Redis 五类型 + 底层结构'),
    bagu('d4-2', '07 缓存穿透/击穿/雪崩')
  ]},
  { id: 'd5', title: 'D5 · Redis 进阶 + OS', items: [
    bagu('d5-1', '07 持久化 + 主从/Cluster'),
    bagu('d5-2', '09 进程线程区别、死锁四条件')
  ]},
  { id: 'd6', title: 'D6 · Java 并发', items: [
    bagu('d6-1', '03 synchronized 原理'),
    bagu('d6-2', '03 volatile + CAS + AQS')
  ]},
  { id: 'd7', title: 'D7 · 线程池 + 集合', items: [
    bagu('d7-1', '03 线程池 7 参数 + 拒绝策略'),
    bagu('d7-2', '02 HashMap put 全流程 + CHM'),
    { id: 'd7-3', text: '第一周复盘：画 MVCC 图、错题本', tag: '复盘' }
  ]},
  { id: 'd8', title: 'D8 · TCP', items: [
    bagu('d8-1', '08 TCP 三次握手/四次挥手 + TIME_WAIT')
  ]},
  { id: 'd9', title: 'D9 · HTTP', items: [
    bagu('d9-1', '08 HTTP/HTTPS + URL 到页面'),
    { id: 'd9-2', text: 'STAR 故事打磨（第二版）', tag: '项目' }
  ]},
  { id: 'd10', title: 'D10 · JVM', items: [
    bagu('d10-1', '04 JVM 内存 + GC 收集器')
  ]},
  { id: 'd11', title: 'D11 · JVM 排查', items: [
    bagu('d11-1', '04 类加载 + OOM 排查思路')
  ]},
  { id: 'd12', title: 'D12 · Spring', items: [
    bagu('d12-1', '05 Spring IOC/AOP + Bean 生命周期')
  ]},
  { id: 'd13', title: 'D13 · Spring 事务', items: [
    bagu('d13-1', '05 事务传播 + 循环依赖')
  ]},
  { id: 'd14', title: 'D14 · 模拟面试', items: [
    { id: 'd14-1', text: '八股 30min 自问自答', tag: '模拟' },
    { id: 'd14-2', text: '项目 STAR 完整讲述 1 遍', tag: '项目' }
  ]},
  { id: 'd15', title: 'D15 · 分布式', items: [
    bagu('d15-1', '11 分布式锁 + CAP + 雪花算法'),
    { id: 'd15-2', text: 'CodeTop 目标公司 Top 10', tag: '算法', link: 'https://codetop.cc/' }
  ]},
  { id: 'd16', title: 'D16 · 系统设计', items: [
    bagu('d16-1', '12 秒杀 + 短链各讲 5 min')
  ]},
  { id: 'd17', title: 'D17 · MQ', items: [
    bagu('d17-1', '10 MQ：丢失/重复/积压')
  ]},
  { id: 'd18', title: 'D18 · 大厂追问', items: [
    { id: 'd18-1', text: '过面试题合集高频追问', tag: '八股' },
    { id: 'd18-2', text: 'CodeTop Top 10 二刷', tag: '算法', link: 'https://codetop.cc/' }
  ]},
  { id: 'd19', title: 'D19 · 全真模拟', items: [
    { id: 'd19-1', text: '1h 八股 + 2 题算法 45min + 项目 20min', tag: '模拟' }
  ]},
  { id: 'd20', title: 'D20 · 错题冲刺', items: [
    { id: 'd20-1', text: '只看错题本 + 大厂追问', tag: '冲刺' },
    { id: 'd20-2', text: '每天 4 题保持手感', tag: '算法', link: 'https://leetcode.cn/studyplan/top-100-liked/' }
  ]},
  { id: 'd21', title: 'D21 · 考前调整', items: [
    { id: 'd21-1', text: '过一遍 STAR + 高频八股清单', tag: '冲刺' },
    { id: 'd21-2', text: '每天 4 题保持手感', tag: '算法', link: 'https://leetcode.cn/studyplan/top-100-liked/' },
    { id: 'd21-3', text: '早睡，不再熬夜刷题', tag: '复盘' }
  ]}
];

function lcItem(dayNum, p, idx) {
  const suffix = idx > 0 ? `-${idx}` : '';
  return {
    id: `d${dayNum}-lc-${p.num}${suffix}`,
    text: `LC ${p.num} ${p.title}`,
    tag: '算法',
    link: p.url
  };
}

function buildPlan() {
  const problems = hot100.list();
  const dailyBatches = hot100.chunkBySize(problems, LC_PER_DAY);
  const totalDays = Math.max(BAGU_DAYS_COUNT, LC_DAYS);
  const days = [];

  for (let i = 0; i < totalDays; i++) {
    const dayNum = i + 1;
    const bagu = BAGU_DAYS[i];
    const batch = dailyBatches[i] || [];
    const lcItems = batch.map((p, j) => lcItem(dayNum, p, j));
    const cat = batch[0]?.category;

    if (bagu) {
      const title = cat && dayNum <= LC_DAYS
        ? bagu.title.replace(/^D\d+/, `D${dayNum}`) + ` + Hot 100（${batch.length} 题）`
        : bagu.title;
      days.push({ id: bagu.id, title, items: [...bagu.items, ...lcItems] });
    } else if (batch.length) {
      days.push({
        id: `d${dayNum}`,
        title: `D${dayNum} · Hot 100 · ${cat || '刷题'}`,
        items: lcItems
      });
    }
  }

  return {
    totalDays: days.length,
    planName: `八股冲刺 + Hot 100 全覆盖（${LC_PER_DAY} 题/天 · ${days.length} 天）`,
    days
  };
}

module.exports = buildPlan();
