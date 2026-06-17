/**
 * Dual Database Adapter - SQLite + PostgreSQL
 * Escribe en ambas bases de datos, lee de SQLite
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, process.env.NODE_ENV === 'production' ? '../.env.production' : '../.env') });

let sqliteDb = null;
let pgPool = null;
let isPostgresConnected = false;

const DATABASE_URL = process.env.DATABASE_URL || '';

function initSqlite() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
  console.log('[DB] SQLite conectado');
}

function initPostgres() {
  if (!DATABASE_URL) {
    console.log('[DB] No hay DATABASE_URL, PostgreSQL no disponible');
    return;
  }
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5
    });
    isPostgresConnected = true;
    console.log('[DB] PostgreSQL conectado');
  } catch (e) {
    console.warn('[DB] Error PostgreSQL:', e.message);
    isPostgresConnected = false;
  }
}

function isWriteQuery(query) {
  const q = query.trim().toUpperCase();
  return q.startsWith('INSERT') || q.startsWith('UPDATE') || q.startsWith('DELETE') || q.startsWith('REPLACE');
}

function toPgQuery(query) {
  let i = 1;
  return query.replace(/\?/g, () => '$' + i++);
}

async function pgRun(query, params) {
  if (!isPostgresConnected || !pgPool) return;
  try {
    const pgQuery = toPgQuery(query);
    await pgPool.query(pgQuery, params);
  } catch (e) {
    console.warn('[DB] PostgreSQL error:', e.message);
  }
}

// Initialize on import
initSqlite();
initPostgres();

module.exports = {
  db: sqliteDb,
  isPostgres: isPostgresConnected,
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },
  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.run(query, params, function(err) {
        if (err) return reject(err);
        if (isWriteQuery(query)) {
          pgRun(query, params);
        }
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};
