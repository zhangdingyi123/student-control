const path = require('path');
const fs = require('fs');
const platform = require('./platform');

const VOLUMES_DIR = path.join(__dirname, '../../分册');
const SAFE_ID = /^[0-9]{2}-[\u4e00-\u9fa5A-Za-z0-9_-]+$/;

function resolveVolumePath(id) {
  if (!id || !SAFE_ID.test(id)) return null;
  const filePath = path.join(VOLUMES_DIR, `${id}.md`);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(VOLUMES_DIR))) return null;
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}

function listVolumes() {
  const cfg = platform.readConfig();
  const configMap = new Map(platform.allLibraryItems(cfg).map(v => [v.id, v]));
  if (!fs.existsSync(VOLUMES_DIR)) return [];
  return fs.readdirSync(VOLUMES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const id = f.replace(/\.md$/, '');
      if (!SAFE_ID.test(id)) return null;
      const meta = configMap.get(id);
      const stat = fs.statSync(path.join(VOLUMES_DIR, f));
      return {
        id,
        name: meta?.name || id.replace(/^\d+-/, ''),
        short: meta?.short || id.slice(0, 2),
        questionCount: countQuestions(path.join(VOLUMES_DIR, f))
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id, 'zh-CN'));
}

function countQuestions(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return (text.match(/^### 问：/gm) || []).length;
  } catch {
    return 0;
  }
}

function parseOutline(content) {
  const outline = [];
  content.split('\n').forEach((line, index) => {
    const m2 = line.match(/^## (.+)/);
    const m3 = line.match(/^### (.+)/);
    if (m2) outline.push({ level: 2, text: m2[1].trim(), line: index });
    else if (m3) outline.push({ level: 3, text: m3[1].trim(), line: index });
  });
  return outline;
}

function slugify(text) {
  return String(text)
    .trim()
    .slice(0, 48)
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '');
}

function readVolume(id) {
  const filePath = resolveVolumePath(id);
  if (!filePath) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const cfg = platform.readConfig();
  const meta = platform.allLibraryItems(cfg).find(v => v.id === id);
  const volumes = listVolumes();
  const idx = volumes.findIndex(v => v.id === id);
  return {
    id,
    name: meta?.name || id,
    content: raw,
    outline: parseOutline(raw),
    questionCount: countQuestions(filePath),
    prev: idx > 0 ? volumes[idx - 1] : null,
    next: idx >= 0 && idx < volumes.length - 1 ? volumes[idx + 1] : null
  };
}

module.exports = { listVolumes, readVolume, resolveVolumePath, parseOutline, slugify };
