const API = {
  getToken(role) {
    return localStorage.getItem(`${role}_token`);
  },
  setToken(role, token) {
    if (token) localStorage.setItem(`${role}_token`, token);
    else localStorage.removeItem(`${role}_token`);
  },
  getStudentName() {
    return localStorage.getItem('student_name');
  },
  setStudentName(name) {
    if (name) localStorage.setItem('student_name', name);
    else localStorage.removeItem('student_name');
  },
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const res = await fetch(path, { ...options, headers });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {
      if (path.startsWith('/api/')) {
        throw new Error(res.status === 404
          ? '接口不存在，请重启学习计划平台服务后重试'
          : '服务返回异常，请重启学习计划平台后重试');
      }
      if (!res.ok) {
        throw new Error(`请求失败（HTTP ${res.status}）`);
      }
    }
    if (path.startsWith('/api/') && res.ok && !text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      throw new Error('服务未更新，请重启学习计划平台后重试');
    }
    if (!res.ok) throw new Error(data.error || `请求失败（HTTP ${res.status}）`);
    return data;
  },
  studentAuth() {
    const t = this.getToken('student');
    return t ? { Authorization: `Bearer ${t}` } : {};
  },
  teacherAuth() {
    const t = this.getToken('teacher');
    return t ? { Authorization: `Bearer ${t}` } : {};
  }
};

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  return isToday ? `今天 ${time}` : d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function progressBadge(percent) {
  if (percent >= 80) return '<span class="badge badge-green">' + percent + '%</span>';
  if (percent >= 30) return '<span class="badge badge-yellow">' + percent + '%</span>';
  return '<span class="badge badge-gray">' + percent + '%</span>';
}
