const fs = require('fs');
const { all, run } = require('./lib/db');
const { sendTrialExpiryWarningEmail, sendExpiredEmail } = require('./lib/emails');
const { processUserImproved } = require('./lib/process-user-improved');

// Crear directorio de logs si no existe
const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Función para registrar en archivo
function logToFile(message) {
  const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(`${logsDir}/worker.log`, logMessage);
  } catch (e) {
    console.error('Error escribiendo log:', e.message);
  }
}

// Generar link de pago MercadoPago para un usuario
async function generatePaymentLink(user) {
  try {
    const { MercadoPagoConfig, Preference } = require('mercadopago');
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });
    const preference = new Preference(client);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const result = await preference.create({
      body: {
        items: [{ id: `nova360-${user.id}`, title: 'Nova 360 Automation — Mensualidad', quantity: 1, unit_price: 10000, currency_id: 'COP' }],
        payer: { name: user.nombre, email: user.email },
        back_urls: { success: `${baseUrl}/pago-exitoso?user=${user.id}`, failure: `${baseUrl}/`, pending: `${baseUrl}/` },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/mp-webhook`,
        external_reference: String(user.id),
      },
    });
    return result.init_point;
  } catch (e) {
    console.error('Error generando link MP:', e.message);
    return null;
  }
}

// Verificar y actualizar estado de suscripciones
async function checkSubscriptions() {
  const now = new Date();
  const users = await all(`SELECT * FROM users WHERE subscription_status != 'expired' OR active = 1`);
  
  for (const user of users) {
    // Duvier es VIP: Siempre activo y premium sin pago
    if (user.email === 'daveymena16@gmail.com' || user.nombre.toLowerCase().includes('duvier')) {
      if (user.subscription_status !== 'active' || user.active !== 1) {
        await run(`UPDATE users SET subscription_status = 'active', active = 1 WHERE id = ?`, [user.id]);
      }
      continue;
    }

    const trialEnd = new Date(user.subscription_until || user.trial_start);
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    if (user.subscription_status === 'trial') {
      if (daysLeft <= 0) {
        await run(`UPDATE users SET subscription_status = 'expired', active = 0 WHERE id = ?`, [user.id]);
        console.log(`⏰ Trial expirado para ${user.nombre}. Pausando automatización.`);
        const payLink = await generatePaymentLink(user);
        sendExpiredEmail(user, payLink).catch(() => {});
      } else if (daysLeft === 1) {
        console.log(`⚠️ Trial de ${user.nombre} vence mañana. Enviando aviso.`);
        const payLink = await generatePaymentLink(user);
        sendTrialExpiryWarningEmail(user, payLink).catch(() => {});
      }
    }
  }
}

// Función simplificada que usa processUserImproved
async function processUser(user) {
  return processUserImproved(user);
}

async function startWorker() {
  // Verificar y actualizar suscripciones primero
  await checkSubscriptions();
  
  const users = await all(`SELECT * FROM users WHERE active = 1`);
  console.log(`📦 Procesando ${users.length} usuarios activos...`);
  
  for (let i = 0; i < users.length; i += 3) {
    const batch = users.slice(i, i + 3);
    await Promise.all(batch.map(u => processUser(u)));
  }
}

if (require.main === module) {
  startWorker().then(() => {
    console.log('🏁 Fin del proceso.');
    process.exit(0);
  });
}

module.exports = { startWorker, processUser, processUserImproved };

