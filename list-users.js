const {all} = require('./lib/db');

async function listUsers() {
  try {
    const users = await all(`SELECT id, nombre, cedula, placa, email, active FROM users`);
    console.log('Usuarios registrados:');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

listUsers();
