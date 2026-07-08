
const { Pool } = require("pg");
require("dotenv").config({ path: ".env.production" });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
});

console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL ? "✓ SETEADO" : "✗ VACÍO");
console.log("📍 Probando conexión a: " + (process.env.DATABASE_URL || "UNDEFINED"));

db.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ ERROR:", err.message);
    console.error("Código:", err.code);
    process.exit(1);
  } else {
    console.log("✅ CONEXIÓN EXITOSA");
    console.log("Hora del servidor:", res.rows[0].now);
    process.exit(0);
  }
});

setTimeout(() => {
  console.error("⏱️ TIMEOUT: Sin respuesta en 10 segundos");
  process.exit(1);
}, 10000);

