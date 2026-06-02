/**
 * Script para verificar TODOS los registros en la tabla users
 * Incluye usuarios eliminados, inactivos, y cualquier registro
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 VERIFICACIÓN COMPLETA DE LA BASE DE DATOS SQLITE');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`📂 Archivo: ${dbPath}\n`);

// Verificar si el archivo existe
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  console.log('❌ El archivo database.sqlite NO existe\n');
  console.log('═══════════════════════════════════════════════════════════');
  process.exit(1);
}

const fileStats = fs.statSync(dbPath);
console.log(`📊 Tamaño del archivo: ${fileStats.size} bytes`);
console.log(`📅 Última modificación: ${fileStats.mtime.toLocaleString('es-CO')}\n`);

// Obtener TODOS los usuarios sin filtros
db.all(`SELECT * FROM users ORDER BY id`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error consultando la base de datos:', err.message);
    db.close();
    return;
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📊 TOTAL DE USUARIOS EN LA TABLA: ${rows.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (rows.length === 0) {
    console.log('⚠️ La tabla "users" está VACÍA\n');
  } else {
    rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nombre || 'SIN NOMBRE'}`);
      console.log(`   ├─ ID: ${user.id}`);
      console.log(`   ├─ Cédula: ${user.cedula || 'N/A'}`);
      console.log(`   ├─ Email: ${user.email || 'N/A'}`);
      console.log(`   ├─ Placa: ${user.placa || 'N/A'}`);
      console.log(`   ├─ Teléfono: ${user.telefono || 'N/A'}`);
      console.log(`   ├─ Activo: ${user.active === 1 ? '✅ Sí' : '❌ No'}`);
      console.log(`   ├─ Estado: ${user.subscription_status || 'N/A'}`);
      console.log(`   ├─ Supervisor: ${user.supervisor || 'N/A'}`);
      console.log(`   ├─ KM: ${user.km_actual || 0}`);
      console.log(`   ├─ Registrado: ${user.created_at || 'N/A'}`);
      console.log(`   ├─ Última ejecución: ${user.last_run || 'Nunca'}`);
      console.log(`   └─ Vence: ${user.subscription_until || 'N/A'}`);
      console.log('');
    });
  }

  // Contar por estado
  const activos = rows.filter(u => u.active === 1).length;
  const inactivos = rows.filter(u => u.active === 0).length;
  const premium = rows.filter(u => u.subscription_status === 'active').length;
  const trial = rows.filter(u => u.subscription_status === 'trial').length;
  const expired = rows.filter(u => u.subscription_status === 'expired').length;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📈 ESTADÍSTICAS:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total de registros: ${rows.length}`);
  console.log(`├─ Activos: ${activos}`);
  console.log(`├─ Inactivos: ${inactivos}`);
  console.log(`├─ Premium/Active: ${premium}`);
  console.log(`├─ Trial: ${trial}`);
  console.log(`└─ Expirados: ${expired}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Verificar integridad de IDs
  const ids = rows.map(u => u.id);
  const missingIds = [];
  if (ids.length > 0) {
    const minId = Math.min(...ids);
    const maxId = Math.max(...ids);
    console.log('🔢 Análisis de IDs:');
    console.log(`   Rango: ${minId} a ${maxId}`);
    
    for (let i = minId; i <= maxId; i++) {
      if (!ids.includes(i)) {
        missingIds.push(i);
      }
    }
    
    if (missingIds.length > 0) {
      console.log(`   ⚠️ IDs faltantes (posibles registros eliminados): ${missingIds.join(', ')}`);
    } else {
      console.log(`   ✅ Secuencia de IDs completa (sin eliminaciones)`);
    }
    console.log('');
  }

  db.close();
});
