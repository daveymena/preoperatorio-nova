/**
 * Script para insertar usuario de Davey en PostgreSQL
 * Se ejecuta automáticamente al iniciar la aplicación
 */

const { get, run } = require('./lib/db');

async function seedUsers() {
  try {
    console.log('🌱 Verificando usuario de Davey...');

    // Verificar si el usuario ya existe
    const existingUser = await get(
      'SELECT * FROM users WHERE email = ?',
      ['daveymena16@gmail.com']
    );

    if (existingUser) {
      console.log('✅ Usuario de Davey ya existe en la base de datos');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nombre: ${existingUser.nombre}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Cédula: ${existingUser.cedula}`);
      console.log(`   KM Actual: ${existingUser.km_actual}`);
      console.log(`   Estado: ${existingUser.active ? 'Activo' : 'Inactivo'}`);
      return;
    }

    // Insertar usuario de Davey
    console.log('📝 Insertando usuario de Davey...');

    const result = await run(
      `INSERT INTO users (
        cedula, nombre, placa, email, password, supervisor, km_actual,
        telefono, direccion, ciudad, departamento, empresa, cargo,
        vacaciones_inicio, vacaciones_fin, active, last_run,
        trial_start, subscription_status, subscription_until, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        1, // active
        new Date().toISOString(),
        new Date().toISOString(),
        'active',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días de suscripción
        new Date().toISOString()
      ]
    );

    console.log('✅ Usuario de Davey insertado exitosamente');
    console.log(`   ID: ${result.id}`);
    console.log(`   Nombre: Duvier Prueba`);
    console.log(`   Email: daveymena16@gmail.com`);
    console.log(`   Cédula: 1077449318`);
    console.log(`   KM Actual: 532`);
    console.log(`   Estado: Activo`);
    console.log(`   Suscripción hasta: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
  } catch (error) {
    console.error('❌ Error insertando usuario:', error.message);
    // No lanzar error para que la aplicación continúe
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log('\n✅ Seed completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en seed:', error);
      process.exit(1);
    });
}

module.exports = { seedUsers };
