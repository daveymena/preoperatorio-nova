const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula TEXT UNIQUE,
      nombre TEXT,
      placa TEXT,
      email TEXT,
      password TEXT,
      supervisor TEXT,
      km_actual INTEGER DEFAULT 0,
      vacaciones_inicio TEXT,
      vacaciones_fin TEXT,
      active INTEGER DEFAULT 1,
      last_run TEXT,
      trial_start DATETIME DEFAULT CURRENT_TIMESTAMP,
      subscription_status TEXT DEFAULT 'trial',
      subscription_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migración: añadir columnas si no existen (para instalaciones previas)
  const alterColumns = [
    `ALTER TABLE users ADD COLUMN trial_start DATETIME DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'trial'`,
    `ALTER TABLE users ADD COLUMN subscription_until DATETIME`,
  ];
  alterColumns.forEach(sql => {
    db.run(sql, () => {}); // Ignorar error si ya existe
  });
});

module.exports = {
  db,
  all: (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
  }),
  get: (query, params = []) => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => err ? reject(err) : resolve(row));
  }),
  run: (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      err ? reject(err) : resolve({ id: this.lastID, changes: this.changes });
    });
  })
};
