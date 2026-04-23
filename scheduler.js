const cron = require('node-cron');
const { startWorker } = require('./worker');

// Programar para las 6:00 AM hora de Colombia (GMT-5)
cron.schedule('0 6 * * *', () => {
  console.log('⏰ Iniciando ejecución programada diaria...');
  startWorker();
}, {
  timezone: 'America/Bogota'
});

console.log('📅 Scheduler de Preoperacionales activo (6:00 AM)');
