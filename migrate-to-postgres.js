/**
 * Script para migrar datos de SQLite a PostgreSQL
 * Uso: node migrate-to-postgres.js
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Conexión a SQLite (local)
const sqliteDb = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// Conexión a PostgreSQL (EasyPanel)
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:6715320Dvd.@tecnology_exnoba-db:5432/exnova?sslmode=disable',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('🔄 Iniciando migración de SQLite a PostgreSQL...\n');

    // 1. Crear tabla en PostgreSQL
    console.log('📋 Creando tabla en PostgreSQL...');
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
      )
    `);
    console.log('✅ Tabla creada en PostgreSQL\n');

    // 2. Leer datos de SQLite
    console.log('📖 Leyendo datos de SQLite...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
    console.log(`✅ ${users.length} usuario(s) encontrado(s) en SQLite\n`);

    // 3. Insertar datos en PostgreSQL
    if (users.length > 0) {
      console.log('📤 Insertando datos en PostgreSQL...');
      
      for (const user of users) {
        try {
          await pgPool.query(
            `INSERT INTO users (
              cedula, nombre, placa, email, password, supervisor, km_actual,
              telefono, direccion, ciudad, departamento, empresa, cargo,
              vacaciones_inicio, vacaciones_fin, active, last_run,
              trial_start, subscription_status, subscription_until, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            ON CONFLICT (cedula) DO UPDATE SET
              nombre = EXCLUDED.nombre,
              placa = EXCLUDED.placa,
              email = EXCLUDED.email,
              password = EXCLUDED.password,
              supervisor = EXCLUDED.supervisor,
              km_actual = EXCLUDED.km_actual,
              telefono = EXCLUDED.telefono,
              direccion = EXCLUDED.direccion,
              ciudad = EXCLUDED.ciudad,
              departamento = EXCLUDED.departamento,
              empresa = EXCLUDED.empresa,
              cargo = EXCLUDED.cargo,
              vacaciones_inicio = EXCLUDED.vacaciones_inicio,
              vacaciones_fin = EXCLUDED.vacaciones_fin,
              active = EXCLUDED.active,
              last_run = EXCLUDED.last_run
            `,
            [
              user.cedula,
              user.nombre,
              user.placa,
              user.email,
              user.password,
              user.supervisor,
              user.km_actual,
              user.telefono,
              user.direccion,
              user.ciudad,
              user.departamento,
              user.empresa,
              user.cargo,
              user.vacaciones_inicio,
              user.vacaciones_fin,
              user.active,
              user.last_run,
              user.trial_start,
              user.subscription_status,
              user.subscription_until,
              user.created_at
            ]
          );
          console.log(`  ✅ ${user.nombre} (${user.cedula}) migrado`);
        } catch (err) {
          console.error(`  ❌ Error migrando ${user.nombre}:`, err.message);
        }
      }
      console.log('\n✅ Migración completada\n');
    } else {
      console.log('⚠️ No hay usuarios para migrar\n');
    }

    // 4. Verificar datos en PostgreSQL
    console.log('🔍 Verificando datos en PostgreSQL...');
    const result = await pgPool.query('SELECT * FROM users');
    console.log(`✅ ${result.rows.length} usuario(s) en PostgreSQL\n`);
    
    result.rows.forEach(user => {
      console.log(`  📌 ${user.nombre} (${user.cedula}) - KM: ${user.km_actual}`);
    });

    // Si no hay usuarios, insertar el usuario de Davey
    if (result.rows.length === 0) {
      console.log('\n⚠️ No hay usuarios en PostgreSQL. Insertando usuario de Davey...');
      
      await pgPool.query(
        `INSERT INTO users (
          cedula, nombre, placa, email, password, supervisor, km_actual,
          telefono, direccion, ciudad, departamento, empresa, cargo,
          vacaciones_inicio, vacaciones_fin, active, last_run,
          trial_start, subscription_status, subscription_until, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          '1077449318',
          'Duvier Prueba',
          'TEST-99',
          'daveymena16@gmail.com',
          '1077449318',
          'Eduardo Villareal',
          532,
          '3000000000',
          'Calle Principal 123',
          'Bogotá',
          'Cundinamarca',
          'Conectar TV',
          'Conductor',
          null,
          null,
          1,
          new Date().toISOString(),
          new Date().toISOString(),
          'premium', // PREMIUM - No expira nunca
          new Date(Date.now() + 365 * 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 años = permanente
          new Date().toISOString()
        ]
      );
      
      console.log('✅ Usuario de Davey insertado exitosamente (PREMIUM PERMANENTE)');
    }

    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

migrate();
