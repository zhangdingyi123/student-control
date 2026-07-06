const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const pu = require('./planUtils');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'platform.db');
const LEGACY_JSON = path.join(DATA_DIR, 'store.json');

let db;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getDb() {
  if (!db) {
    ensureDataDir();
    db = new DatabaseSync(DB_FILE, { enableForeignKeyConstraints: true });
    db.exec('PRAGMA journal_mode = WAL');
    initSchema();
    migrateFromJsonIfNeeded();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      pin TEXT DEFAULT '',
      plan_id TEXT,
      batch TEXT DEFAULT '',
      plan_start_date TEXT,
      teacher_note TEXT DEFAULT '',
      teacher_note_at TEXT,
      checks TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_check_in TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      student_id TEXT,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      plan_name TEXT NOT NULL,
      start_date TEXT,
      description TEXT DEFAULT '',
      class_name TEXT DEFAULT '',
      total_days INTEGER DEFAULT 0,
      days TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_students_plan_id ON students(plan_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);
}

function rowToStudent(row) {
  return {
    id: row.id,
    name: row.name,
    pin: row.pin || '',
    planId: row.plan_id || null,
    batch: row.batch || '',
    planStartDate: row.plan_start_date || null,
    teacherNote: row.teacher_note || '',
    teacherNoteAt: row.teacher_note_at || null,
    checks: JSON.parse(row.checks || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastCheckIn: row.last_check_in || null
  };
}

function rowToPlan(row) {
  const days = JSON.parse(row.days || '[]');
  return {
    id: row.id,
    planName: row.plan_name,
    startDate: row.start_date || null,
    description: row.description || '',
    className: row.class_name || '',
    totalDays: row.total_days ?? days.length,
    days,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function readStore() {
  const database = getDb();
  const students = database.prepare('SELECT * FROM students').all().map(rowToStudent);
  const plans = database.prepare('SELECT * FROM plans ORDER BY created_at').all().map(rowToPlan);

  const sessions = {};
  database.prepare('SELECT * FROM sessions').all().forEach(row => {
    sessions[row.token] = {
      role: row.role,
      studentId: row.student_id || undefined,
      expiresAt: row.expires_at
    };
  });

  const activeRow = database.prepare("SELECT value FROM settings WHERE key = 'activePlanId'").get();
  const activePlanId = activeRow?.value || null;

  const store = { students, sessions, plans, activePlanId };
  const migrated = pu.migrateStore(store);
  if (JSON.stringify(migrated) !== JSON.stringify(store)) {
    writeStore(migrated);
  }
  return migrated;
}

function writeStore(data) {
  const database = getDb();
  database.exec('BEGIN');
  try {
    database.prepare('DELETE FROM students').run();
    database.prepare('DELETE FROM sessions').run();
    database.prepare('DELETE FROM plans').run();

    const insertStudent = database.prepare(`
      INSERT INTO students (
        id, name, pin, plan_id, batch, plan_start_date,
        teacher_note, teacher_note_at, checks,
        created_at, updated_at, last_check_in
      ) VALUES (
        @id, @name, @pin, @plan_id, @batch, @plan_start_date,
        @teacher_note, @teacher_note_at, @checks,
        @created_at, @updated_at, @last_check_in
      )
    `);

    (data.students || []).forEach(s => {
      insertStudent.run({
        id: s.id,
        name: s.name,
        pin: s.pin || '',
        plan_id: s.planId || null,
        batch: s.batch || '',
        plan_start_date: s.planStartDate || null,
        teacher_note: s.teacherNote || '',
        teacher_note_at: s.teacherNoteAt || null,
        checks: JSON.stringify(s.checks || {}),
        created_at: s.createdAt,
        updated_at: s.updatedAt,
        last_check_in: s.lastCheckIn || null
      });
    });

    const insertSession = database.prepare(`
      INSERT INTO sessions (token, role, student_id, expires_at)
      VALUES (@token, @role, @student_id, @expires_at)
    `);

    Object.entries(data.sessions || {}).forEach(([token, sess]) => {
      insertSession.run({
        token,
        role: sess.role,
        student_id: sess.studentId || null,
        expires_at: sess.expiresAt
      });
    });

    const insertPlan = database.prepare(`
      INSERT INTO plans (
        id, plan_name, start_date, description, class_name,
        total_days, days, created_at, updated_at
      ) VALUES (
        @id, @plan_name, @start_date, @description, @class_name,
        @total_days, @days, @created_at, @updated_at
      )
    `);

    (data.plans || []).forEach(p => {
      insertPlan.run({
        id: p.id,
        plan_name: p.planName,
        start_date: p.startDate || null,
        description: p.description || '',
        class_name: p.className || '',
        total_days: p.totalDays ?? p.days?.length ?? 0,
        days: JSON.stringify(p.days || []),
        created_at: p.createdAt,
        updated_at: p.updatedAt
      });
    });

    database.prepare(`
      INSERT INTO settings (key, value) VALUES ('activePlanId', @value)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run({ value: data.activePlanId || '' });

    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

function migrateFromJsonIfNeeded() {
  if (!fs.existsSync(LEGACY_JSON)) return;

  const hasData = db.prepare('SELECT COUNT(*) AS n FROM students').get().n > 0
    || db.prepare('SELECT COUNT(*) AS n FROM plans').get().n > 0;

  if (hasData) return;

  try {
    const raw = JSON.parse(fs.readFileSync(LEGACY_JSON, 'utf8'));
    const migrated = pu.migrateStore(raw);
    writeStore(migrated);
    const backup = LEGACY_JSON + '.migrated';
    fs.renameSync(LEGACY_JSON, backup);
    console.log(`✅ 已从 store.json 迁移到 SQLite，原文件备份为 ${path.basename(backup)}`);
  } catch (err) {
    console.error('⚠️  store.json 迁移失败:', err.message);
  }
}

function ensureDataFile() {
  getDb();
}

module.exports = { readStore, writeStore, ensureDataFile, DB_FILE };
