/**
 * Script de Pruebas Completas del Sistema
 * Verifica toda la funcionalidad automática
 */

// Cargar variables de entorno
require('dotenv').config();

const { get, run, all } = require('./lib/db');
const { seedUsers } = require('./seed-users');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDatabaseConnection() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('TEST 1: CONEXIÓN A BASE DE DATOS', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  try {
    const result = await get('SELECT 1 as test');
    if (result && result.test === 1) {
      log('✅ Conexión a base de datos: EXITOSA', 'green');
      
      // Verificar tipo de BD
      const dbType = process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite';
      log(`   Tipo: ${dbType}`, 'blue');
      
      if (process.env.DATABASE_URL) {
        log(`   URL: ${process.env.DATABASE_URL.substring(0, 40)}...`, 'blue');
      }
      
      return true;
    }
  } catch (error) {
    log('❌ Error de conexión: ' + error.message, 'red');
    return false;
  }
}

async function testTablesCreation() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('TEST 2: CREACIÓN DE TABLAS', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  try {
    // Verificar tabla users
    const users = await all('SELECT * FROM users LIMIT 1');
    log('✅ Tabla users: EXISTE', 'green');

    // Verificar tabla payments
    try {
      const payments = await all('SELECT * FROM payments LIMIT 1');
      log('✅ Tabla payments: EXISTE', 'green');
    } catch (error) {
      log('⚠️ Tabla payments: NO EXISTE (se creará automáticamente)', 'yellow');
    }

    return true;
  } catch (error) {
    log('❌ Error verificando tablas: ' + error.message, 'red');
    return false;
  }
}

async function testUserSeed() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('TEST 3: SEED DE USUARIO DAVEY', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  try {
    // Ejecutar seed
    await seedUsers();

    // Verificar que el usuario existe
    const user = await get('SELECT * FROM users WHERE email = ?', ['daveymena16@gmail.com']);

    if (user) {
      log('✅ Usuario Davey: EXISTE', 'green');
      log(`   ID: ${user.id}`, 'blue');
      log(`   Nombre: ${user.nombre}`, 'blue');
      log(`   Email: ${user.email}`, 'blue');
      log(`   Cédula: ${user.cedula}`, 'blue');
      log(`   KM Actual: ${user.km_actual}`, 'blue');
      log(`   Estado: ${user.active ? 'ACTIVO ✅' : 'INACTIVO ❌'}`, user.active ? 'green' : 'red');
      
      if (user.subscription_until) {
        const expiryDate = new Date(user.subscription_until);
        const now = new Date();
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        log(`   Suscripción: ${daysLeft} días restantes`, daysLeft > 0 ? 'green' : 'red');
      }

      return true;
    } else {
      log('❌ Usuario Davey: NO EXISTE', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Error en seed: ' + error.message, 'red');
    return false;
  }
}

async function testUserCount() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('TEST 4: CONTEO DE USUARIOS', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  try {
    const result = await get('SELECT COUNT(*) as count FROM users');
    const count = result?.count || 0;

    log(`✅ Total de usuarios: ${count}`, 'green');

    if (count === 0) {
      log('⚠️ No hay usuarios. Ejecuta el seed.', 'yellow');
    } else if (count === 1) {
      log('✅ Sistema con 1 usuario (correcto para inicio)', 'green');
    } else {
      log(`ℹ️ Sistema con ${count} usuarios`, 'blue');
    }

    return true;
  } catch (error) {
    log('❌ Error contando usuarios: ' + error.message, 'red');
    return false;
  }
}

async function testUserLogin() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('TEST 5: VERIFICACIÓN DE LOGIN', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  try {
    const user = await get(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      ['daveymena16@gmail.com', '1077449318']
    );

    if (user) {
      log('✅ Credenciales de login: VÁLIDAS', 'green');
      log(`   Email: daveymena16@gmail.com`, 'blue');
      log(`   Contraseña: 1077449318`, 'blue');
      return true;
    } else {
      log('❌ Credenciales de login: INVÁLIDAS', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Error verificando login: ' + error.message, 'red');
    return false;
  }
}

async function testPaymentsTable() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('TEST 6: TABLA DE PAGOS', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  try {
    const result = await get('SELECT COUNT(*) as count FROM payments');
    const count = result?.count || 0;

    log(`✅ Tabla payments: EXISTE`, 'green');
    log(`   Total de pagos: ${count}`, 'blue');

    return true;
  } catch (error) {
    log('❌ Tabla payments: NO EXISTE', 'red');
    log('   Se creará automáticamente al iniciar', 'yellow');
    return false;
  }
}

async function testEnvironmentVariables() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('TEST 7: VARIABLES DE ENTORNO', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  const requiredVars = [
    'DATABASE_URL',
    'SMTP_HOST',
    'SMTP_USER',
    'EMAIL_FROM',
    'TRANSFER_NUMBER',
    'MERCADO_PAGO_PUBLIC_KEY',
    'PAYPAL_CLIENT_ID'
  ];

  const optionalVars = [
    'NODE_ENV',
    'NEXT_PUBLIC_API_URL',
    'PUPPETEER_EXECUTABLE_PATH'
  ];

  let allPresent = true;

  log('Variables requeridas:', 'bold');
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: Configurada`, 'green');
    } else {
      log(`❌ ${varName}: NO configurada`, 'red');
      allPresent = false;
    }
  });

  log('\nVariables opcionales:', 'bold');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: ${process.env[varName]}`, 'green');
    } else {
      log(`⚠️ ${varName}: NO configurada (opcional)`, 'yellow');
    }
  });

  return allPresent;
}

async function testAllUsers() {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('TEST 8: LISTADO DE TODOS LOS USUARIOS', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  try {
    const users = await all('SELECT id, nombre, email, cedula, placa, km_actual, active FROM users ORDER BY id ASC');

    if (users && users.length > 0) {
      log(`✅ Total de usuarios: ${users.length}`, 'green');
      log('\nDetalles:', 'bold');
      
      users.forEach(user => {
        log(`\n  Usuario #${user.id}:`, 'blue');
        log(`    Nombre: ${user.nombre}`, 'blue');
        log(`    Email: ${user.email}`, 'blue');
        log(`    Cédula: ${user.cedula}`, 'blue');
        log(`    Placa: ${user.placa}`, 'blue');
        log(`    KM: ${user.km_actual}`, 'blue');
        log(`    Estado: ${user.active ? 'ACTIVO ✅' : 'INACTIVO ❌'}`, user.active ? 'green' : 'red');
      });

      return true;
    } else {
      log('⚠️ No hay usuarios en la base de datos', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Error listando usuarios: ' + error.message, 'red');
    return false;
  }
}

async function generateReport(results) {
  log('\n═══════════════════════════════════════════════════════════', 'blue');
  log('REPORTE FINAL DE PRUEBAS', 'bold');
  log('═══════════════════════════════════════════════════════════', 'blue');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const percentage = Math.round((passed / total) * 100);

  log(`\nTotal de pruebas: ${total}`, 'blue');
  log(`Pruebas exitosas: ${passed}`, 'green');
  log(`Pruebas fallidas: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Porcentaje: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');

  log('\nDetalle:', 'bold');
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${icon} Test ${index + 1}: ${result.name}`, color);
  });

  if (percentage === 100) {
    log('\n🎉 TODOS LOS TESTS PASARON - SISTEMA LISTO PARA PRODUCCIÓN', 'green');
  } else if (percentage >= 80) {
    log('\n⚠️ ALGUNOS TESTS FALLARON - REVISAR ANTES DE PRODUCCIÓN', 'yellow');
  } else {
    log('\n❌ MUCHOS TESTS FALLARON - SISTEMA NO LISTO PARA PRODUCCIÓN', 'red');
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'blue');
  log('║     PRUEBAS COMPLETAS DEL SISTEMA PREOPERACIONAL         ║', 'blue');
  log('╚═══════════════════════════════════════════════════════════╝', 'blue');

  const results = [];

  // Test 1: Conexión a BD
  results.push({
    name: 'Conexión a Base de Datos',
    passed: await testDatabaseConnection()
  });

  // Test 2: Tablas
  results.push({
    name: 'Creación de Tablas',
    passed: await testTablesCreation()
  });

  // Test 3: Seed
  results.push({
    name: 'Seed de Usuario Davey',
    passed: await testUserSeed()
  });

  // Test 4: Conteo
  results.push({
    name: 'Conteo de Usuarios',
    passed: await testUserCount()
  });

  // Test 5: Login
  results.push({
    name: 'Verificación de Login',
    passed: await testUserLogin()
  });

  // Test 6: Pagos
  results.push({
    name: 'Tabla de Pagos',
    passed: await testPaymentsTable()
  });

  // Test 7: Variables
  results.push({
    name: 'Variables de Entorno',
    passed: await testEnvironmentVariables()
  });

  // Test 8: Listado
  results.push({
    name: 'Listado de Usuarios',
    passed: await testAllUsers()
  });

  // Reporte final
  await generateReport(results);

  process.exit(0);
}

main().catch(error => {
  log('\n❌ ERROR FATAL EN PRUEBAS: ' + error.message, 'red');
  console.error(error);
  process.exit(1);
});
