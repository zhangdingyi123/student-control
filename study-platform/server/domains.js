const platform = require('./platform');

function normalizeHost(host) {
  return String(host || '').toLowerCase().replace(/^www\./, '').split(':')[0];
}

function readDomains() {
  const cfg = platform.readConfig();
  const d = cfg.domains || {};
  return {
    student: process.env.STUDENT_DOMAIN || d.student || '',
    teacher: process.env.TEACHER_DOMAIN || d.teacher || '',
    useHttps: process.env.USE_HTTPS === '1' || process.env.USE_HTTPS === 'true' || d.useHttps === true
  };
}

function baseUrl(domain, useHttps) {
  if (!domain) return '';
  const proto = useHttps ? 'https' : 'http';
  return `${proto}://${domain}`;
}

function getDomainConfig() {
  const { student, teacher, useHttps } = readDomains();
  return {
    studentDomain: student,
    teacherDomain: teacher,
    studentUrl: student ? baseUrl(student, useHttps) : '',
    teacherUrl: teacher ? baseUrl(teacher, useHttps) : '',
    useHttps
  };
}

/** 根据 Host 分流学员/教师入口 */
function domainRouter(req, res, next) {
  const { student, teacher, useHttps } = readDomains();
  if (!student && !teacher) return next();

  const host = normalizeHost(req.hostname);
  const path = req.path;
  const proto = useHttps ? 'https' : req.protocol;

  const studentBase = student ? `${proto}://${student}` : '';
  const teacherBase = teacher ? `${proto}://${teacher}` : '';

  if (host === normalizeHost(student)) {
    if (path === '/' || path === '/index.html') {
      return res.redirect(302, '/student/');
    }
    if (path.startsWith('/teacher')) {
      return teacherBase
        ? res.redirect(302, `${teacherBase}${path}`)
        : res.status(403).send('教师端请使用教师域名访问');
    }
  }

  if (host === normalizeHost(teacher)) {
    if (path === '/' || path === '/index.html') {
      return res.redirect(302, '/teacher/');
    }
    if (path.startsWith('/student')) {
      return studentBase
        ? res.redirect(302, `${studentBase}${path}`)
        : res.status(403).send('学员端请使用学员域名访问');
    }
  }

  next();
}

module.exports = {
  normalizeHost,
  readDomains,
  getDomainConfig,
  domainRouter
};
