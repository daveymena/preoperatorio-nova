const { get, run } = require('./lib/db');
const { processUserImproved } = require('./lib/process-user-improved');
const WebSocket = require('ws');
const fs = require('fs');

const log = msg => fs.appendFileSync('./logs/test-run.log', `[${new Date().toISOString()}] ${msg}\n`);

(async () => {
  try {
    const user = await get(`SELECT * FROM users WHERE email = 'daveymena16@gmail.com' LIMIT 1`);
    if (!user) { console.log('USER_NOT_FOUND'); process.exit(1); return; }

    console.log('USER:', user.nombre, 'KM:', user.km_actual);
    log(`Iniciando para ${user.nombre} (KM: ${user.km_actual})`);

    await processUserImproved(user);
    console.log('PROCESS_DONE');
    log('Preoperatorio completado exitosamente');

    const u2 = await get(`SELECT km_actual FROM users WHERE id = ${user.id}`);
    console.log('NEW_KM:', u2.km_actual);
    log(`Nuevo KM: ${u2.km_actual}`);

    // sync-km via WebSocket
    const ws = new WebSocket('wss://tecnology-opencode-evo.vr7gwz.easypanel.host/agent');
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'sync-km',
        cedula: String(user.cedula),
        km_actual: u2.km_actual,
        last_run: new Date().toISOString()
      }));
      console.log('SYNC_KM_SENT');
      log('Sync-KM enviado a PostgreSQL');
      ws.close();
      process.exit(0);
    });
    ws.on('error', e => {
      console.log('WS_ERR:', e.message);
      log('Error WebSocket: ' + e.message);
      process.exit(1);
    });
    setTimeout(() => {
      console.log('WS_TIMEOUT');
      log('Timeout WebSocket');
      process.exit(1);
    }, 15000);
  } catch (e) {
    console.log('FATAL:', e.message);
    log('Error fatal: ' + e.message);
    process.exit(1);
  }
})();
