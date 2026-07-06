const path = require('path');
const fs = require('fs');

const CONFIG_FILE = path.join(__dirname, 'data', 'platform.json');

const FALLBACK = {
  platformName: '学习计划平台',
  platformSubtitle: '小班辅导 · 每日打卡',
  defaultTag: '学习',
  tags: ['学习', '八股', '算法', '阅读', '视频', '练习', '复盘', '模拟', '作业', '项目', '其他'],
  externalResources: [],
  libraries: [],
  taskPresets: [],
  planTemplates: []
};

function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return { ...FALLBACK };
    return { ...FALLBACK, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
  } catch {
    return { ...FALLBACK };
  }
}

function writeConfig(data) {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

function getTags(config = readConfig()) {
  return config.tags?.length ? config.tags : FALLBACK.tags;
}

function normalizeTag(tag, config = readConfig()) {
  const t = (tag || '').trim();
  if (!t) return config.defaultTag || '学习';
  const tags = getTags(config);
  if (tags.includes(t)) return t;
  return t;
}

function allLibraryItems(config = readConfig()) {
  return (config.libraries || []).flatMap(lib =>
    (lib.items || []).map(item => ({ ...item, libraryId: lib.id, libraryName: lib.name }))
  );
}

module.exports = {
  CONFIG_FILE,
  FALLBACK,
  readConfig,
  writeConfig,
  getTags,
  normalizeTag,
  allLibraryItems
};
