const { get } = require('./lib/db');
get("SELECT nombre, cedula, km_actual FROM users WHERE email = 'daveymena16@gmail.com' LIMIT 1")
  .then(r => console.log('USER:', JSON.stringify(r)))
  .catch(e => console.log('ERR:', e.message));
