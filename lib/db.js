const path = require('path');
require("dotenv").config({ path: path.join(__dirname, "../.env.production") });

let db;
let isPostgres = false;

if (process.env.DATABASE_URL) {
const { Pool } = require('pg');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  isPostgres = true;
  console.log('🐘 Conectado a PostgreSQL');
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  db = new sqlite3.Database(dbPath);
  console.log('📁 Conectado a SQLite');
}

// Inicialización de tablas
async function init() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      ${isPostgres ? 'id SERIAL PRIMARY KEY' : 'id INTEGER PRIMARY KEY AUTOINCREMENT'},
      cedula TEXT UNIQUE,
      nombre TEXT,
      placa TEXT,
      email TEXT,
      password TEXT,
      supervisor TEXT,
      km_actual INTEGER DEFAULT 0,
      telefono TEXT,
      direccion TEXT,
      ciudad TEXT,
      departamento TEXT,
      empresa TEXT,
      cargo TEXT,
      vacaciones_inicio TEXT,
      vacaciones_fin TEXT,
      active INTEGER DEFAULT 1,
      last_run TEXT,
      trial_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      subscription_status TEXT DEFAULT 'trial',
      subscription_until TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      ${isPostgres ? 'id SERIAL PRIMARY KEY' : 'id INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id INTEGER NOT NULL,
      method TEXT NOT NULL,
      amount DECIMAL(10, 2),
      status TEXT DEFAULT 'pending',
      transaction_id TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ${isPostgres ? 'FOREIGN KEY (user_id) REFERENCES users(id)' : ''}
    );
  `;

  if (isPostgres) {
    const queries = schema.split(';').filter(q => q.trim());
    for (const query of queries) {
      if (query.trim()) {
        await db.query(query);
      }
    }
  } else {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(schema, (err) => {
          if (err) return reject(err);
          // Migraciones para SQLite si ya existe la tabla
          const alterColumns = [
            `ALTER TABLE users ADD COLUMN trial_start DATETIME DEFAULT CURRENT_TIMESTAMP`,
            `ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'trial'`,
            `ALTER TABLE users ADD COLUMN subscription_until DATETIME`,
            `ALTER TABLE users ADD COLUMN telefono TEXT`,
            `ALTER TABLE users ADD COLUMN direccion TEXT`,
            `ALTER TABLE users ADD COLUMN ciudad TEXT`,
            `ALTER TABLE users ADD COLUMN departamento TEXT`,
            `ALTER TABLE users ADD COLUMN empresa TEXT`,
            `ALTER TABLE users ADD COLUMN cargo TEXT`,
          ];
          alterColumns.forEach(sql => db.run(sql, () => {}));
          resolve();
        });
      });
    });
  }
}

// Ejecutar init al cargar
init().catch(err => console.error('Error inicializando DB:', err));

module.exports = {
  db,
  isPostgres,
  all: (query, params = []) => {
    if (isPostgres) {
      // Reemplazar ? por $1, $2, etc. para Postgres
      let i = 1;
      const pgQuery = query.replace(/\?/g, () => `$${i++}`);
      return db.query(pgQuery, params).then(res => res.rows);
    }
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
  },
  get: (query, params = []) => {
    if (isPostgres) {
      let i = 1;
      const pgQuery = query.replace(/\?/g, () => `$${i++}`);
      return db.query(pgQuery, params).then(res => res.rows[0]);
    }
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => err ? reject(err) : resolve(row));
    });
  },
  run: (query, params = []) => {
    if (isPostgres) {
      let i = 1;
      const pgQuery = query.replace(/\?/g, () => `$${i++}`);
      return db.query(pgQuery, params).then(res => ({ id: null, changes: res.rowCount }));
    }
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        err ? reject(err) : resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};
