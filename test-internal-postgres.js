
const { Pool } = require("pg");

const connectionString = "postgres://davey:6715320@tecnology_posgrest-db:5432/postgres?sslmode=disable";

console.log("🔍 Probando conexión a:", connectionString);

const db = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 2000,
  connectionTimeoutMillis: 10000,
});

db.query("SELECT NOW() as current_time, version()", (err, res) => {
  if (err) {
    console.error("❌ ERROR:", err.code, "-", err.message);
    process.exit(1);
  } else {
    console.log("✅ CONEXIÓN EXITOSA");
    console.log("Hora del servidor:", res.rows[0].current_time);
    console.log("Versión PostgreSQL:", res.rows[0].version);
    
    // Test query to davey table
    db.query("SELECT COUNT(*) as count FROM users WHERE email = $1", ["daveymena16@gmail.com"], (err2, res2) => {
      if (err2) {
        console.error("❌ ERROR al consultar usuarios:", err2.message);
      } else {
        console.log("✅ Usuarios encontrados para daveymena16@gmail.com:", res2.rows[0].count);
      }
      process.exit(0);
    });
  }
});

setTimeout(() => {
  console.error("⏱️ TIMEOUT - No hay conexión");
  process.exit(1);
}, 12000);

