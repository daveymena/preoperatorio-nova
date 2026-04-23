// POST /api/mp-webhook
// Recibe notificaciones de MercadoPago y activa la suscripción automáticamente

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  // MercadoPago envía GET para validación y POST para notificaciones
  if (req.method === 'GET') return res.status(200).send('OK');
  if (req.method !== 'POST') return res.status(405).end();

  const { run, get } = require('../../lib/db');
  const { sendWelcomeEmail } = require('../../lib/emails');

  try {
    const { type, data } = req.body;
    console.log('📨 Webhook MP recibido:', type, data);

    if (type !== 'payment') {
      return res.status(200).json({ received: true });
    }

    // Consultar el pago a la API de MercadoPago
    const { MercadoPagoConfig, Payment } = require('mercadopago');
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    });

    const paymentApi = new Payment(client);
    const payment = await paymentApi.get({ id: data.id });

    console.log(`💳 Pago ID ${data.id} — Status: ${payment.status} — Ref: ${payment.external_reference}`);

    if (payment.status !== 'approved') {
      return res.status(200).json({ received: true, status: payment.status });
    }

    // Activar suscripción del usuario
    const userId = parseInt(payment.external_reference);
    if (!userId || isNaN(userId)) {
      console.error('No se pudo obtener userId desde external_reference:', payment.external_reference);
      return res.status(200).json({ received: true });
    }

    const user = await get(`SELECT * FROM users WHERE id = ?`, [userId]);
    if (!user) {
      console.error('Usuario no encontrado:', userId);
      return res.status(200).json({ received: true });
    }

    // Calcular nueva fecha de vencimiento (30 días desde hoy o desde el vencimiento actual)
    const now = new Date();
    const currentUntil = user.subscription_until ? new Date(user.subscription_until) : null;
    const base = (currentUntil && currentUntil > now) ? currentUntil : now;
    const newUntil = new Date(base);
    newUntil.setDate(newUntil.getDate() + 30);

    await run(
      `UPDATE users SET subscription_status = 'active', subscription_until = ?, active = 1 WHERE id = ?`,
      [newUntil.toISOString(), userId]
    );

    console.log(`✅ Suscripción activada para ${user.nombre} hasta ${newUntil.toLocaleDateString('es-CO')}`);

    // Enviar email de confirmación de pago
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"Nova 360 Automation" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `✅ Pago recibido — Tu suscripción Nova 360 fue activada`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:40px;border-radius:16px;">
          <h1 style="color:#22c55e;">✅ ¡Pago confirmado!</h1>
          <p>Hola <strong>${user.nombre}</strong>, recibimos tu pago correctamente.</p>
          <div style="background:#1e293b;border-radius:12px;padding:24px;margin:24px 0;">
            <p><strong>Plan:</strong> Nova 360 Automation — Mensualidad</p>
            <p><strong>Válido hasta:</strong> ${newUntil.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Estado:</strong> <span style="color:#22c55e;">✅ Activo</span></p>
          </div>
          <p>Tu preoperacional seguirá enviándose automáticamente cada mañana a las 6:00 AM.</p>
          <p style="color:#64748b;font-size:14px;">Nova 360 Automation © 2026</p>
        </div>
      `,
    });

    res.status(200).json({ received: true, activated: true });
  } catch (error) {
    console.error('Error en webhook MP:', error);
    res.status(500).json({ error: error.message });
  }
}
