/** 八股任务 → 小林 coding 具体文章页（非专题首页） */
const BASE = 'https://xiaolincoding.com';

/** 按优先级匹配：越靠前越具体 */
const TOPIC_RULES = [
  // Redis 图解专题
  { keys: ['缓存穿透', '缓存击穿', '缓存雪崩', '击穿', '雪崩'], url: `${BASE}/redis/cluster/cache_problem.html` },
  { keys: ['持久化', 'AOF', 'RDB'], url: `${BASE}/redis/storage/aof.html` },
  { keys: ['主从', 'Cluster', 'cluster', '哨兵', '集群'], url: `${BASE}/redis/cluster/master_slave_replication.html` },
  { keys: ['五类型', '底层结构', '数据结构', '数据类型'], url: `${BASE}/redis/data_struct/data_struct.html` },

  // MySQL 图解专题
  { keys: ['索引', 'B+', 'B树', '最左', '覆盖索引', '索引失效'], url: `${BASE}/mysql/index/why_index_chose_bpuls_tree.html` },
  { keys: ['MVCC', 'redo', 'undo', 'binlog', '事务', '隔离级别'], url: `${BASE}/mysql/transaction/mvcc.html` },
  { keys: ['行锁', '间隙锁', '临键锁', '死锁'], url: `${BASE}/mysql/lock/mysql_lock.html` },

  // 网络
  { keys: ['TCP', '三次握手', '四次挥手', 'TIME_WAIT'], url: `${BASE}/network/3_tcp/tcp_interview.html` },
  { keys: ['HTTP', 'HTTPS', 'URL 到页面', 'URL到页面'], url: `${BASE}/network/1_base/what_happen_url.html` },

  // 操作系统
  { keys: ['进程', '线程', '死锁四条件'], url: `${BASE}/os/4_process/deadlock.html` },

  // 面试题合集（Java / Spring / MQ 等）
  { keys: ['synchronized', 'volatile', 'CAS', 'AQS', '线程池', '并发'], url: `${BASE}/interview/juc.html` },
  { keys: ['HashMap', 'CHM', 'ConcurrentHashMap', '集合'], url: `${BASE}/interview/collections.html` },
  { keys: ['Spring', 'IOC', 'AOP', 'Bean', '事务传播', '循环依赖'], url: `${BASE}/interview/spring.html` },
  { keys: ['JVM', 'GC', 'OOM', '类加载'], url: `${BASE}/interview/jvm.html` },
  { keys: ['MQ', '消息队列', '丢失', '重复', '积压'], url: `${BASE}/interview/mq.html` },
  { keys: ['分布式', 'CAP', '雪花'], url: `${BASE}/interview/distributed.html` },
  { keys: ['秒杀', '短链', '系统设计'], url: `${BASE}/interview/systemdesign.html` },
  { keys: ['大厂追问', '面试题合集'], url: `${BASE}/interview/` }
];

const PREFIX_FALLBACK = {
  '06': `${BASE}/interview/mysql.html`,
  '07': `${BASE}/interview/redis.html`,
  '08': `${BASE}/interview/network.html`,
  '09': `${BASE}/interview/os.html`,
  '01': `${BASE}/interview/java.html`,
  '02': `${BASE}/interview/collections.html`,
  '03': `${BASE}/interview/juc.html`,
  '04': `${BASE}/interview/jvm.html`,
  '05': `${BASE}/interview/spring.html`,
  '10': `${BASE}/interview/mq.html`,
  '11': `${BASE}/interview/distributed.html`,
  '12': `${BASE}/interview/systemdesign.html`
};

function matchUrl(topic) {
  const t = topic || '';
  for (const rule of TOPIC_RULES) {
    if (rule.keys.some(k => t.includes(k))) return rule.url;
  }
  return null;
}

function labelFor(topic) {
  const s = topic.replace(/\s+/g, ' ').trim();
  return (s.length > 14 ? s.slice(0, 14) + '…' : s) + ' ›';
}

/** 单条任务解析为 1~N 个链接 */
function resolveBaguLinks(text) {
  const raw = (text || '').trim();
  const prefix = raw.match(/^(\d{2})\s+/)?.[1];
  const body = raw.replace(/^\d{2}\s+/, '').trim();
  if (!body) return [];

  const parts = body.split(/\s+\+\s+/).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    const seen = new Set();
    const links = parts.map(part => {
      const url = matchUrl(part) || (prefix && PREFIX_FALLBACK[prefix]);
      return url ? { label: labelFor(part), url } : null;
    }).filter(l => {
      if (!l || seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });
    if (links.length) return links;
  }

  const url = matchUrl(body) || (prefix && PREFIX_FALLBACK[prefix]);
  return url ? [{ label: '点击进入学习 ›', url }] : [];
}

function linkForBaguTask(text) {
  const links = resolveBaguLinks(text);
  return links[0]?.url || `${BASE}/interview/`;
}

module.exports = {
  TOPIC_RULES,
  PREFIX_FALLBACK,
  resolveBaguLinks,
  linkForBaguTask
};
