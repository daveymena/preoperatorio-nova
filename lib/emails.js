const nodemailer = require('nodemailer');

const CONFIG_SMTP = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'deinermena25@gmail.com',
  pass: 'uccj yqpq vqlt vcie'
};

const transporter = nodemailer.createTransport({
  host: CONFIG_SMTP.host,
  port: CONFIG_SMTP.port,
  secure: CONFIG_SMTP.secure,
  auth: { user: CONFIG_SMTP.user, pass: CONFIG_SMTP.pass }
});

// Email de bienvenida + inicio de trial
async function sendWelcomeEmail(user, trialEndDate) {
  const fechaFin = new Date(trialEndDate).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  await transporter.sendMail({
    from: `"Nova 360 Automation" <${CONFIG_SMTP.user}>`,
    to: user.email,
    subject: `🎉 ¡Bienvenido a Nova 360! Tu automatización está activa — 5 días gratis`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:40px;border-radius:16px;">
        <h1 style="color:#38bdf8;margin-bottom:8px;">¡Hola, ${user.nombre}! 👋</h1>
        <p style="color:#94a3b8;font-size:16px;">Tu registro en <strong style="color:#f8fafc;">Nova 360 Automation</strong> fue exitoso.</p>
        
        <div style="background:#1e293b;border-radius:12px;padding:24px;margin:24px 0;">
          <h2 style="color:#22c55e;margin-top:0;">✅ Tu cuenta está activa</h2>
          <p><strong>Placa:</strong> ${user.placa}</p>
          <p><strong>Supervisor:</strong> ${user.supervisor}</p>
          <p><strong>Cédula:</strong> ${user.cedula}</p>
        </div>

        <div style="background:linear-gradient(135deg,#1e3a5f,#1e293b);border:1px solid #38bdf8;border-radius:12px;padding:24px;margin:24px 0;">
          <h2 style="color:#38bdf8;margin-top:0;">⏳ Trial Gratuito — 5 días</h2>
          <p>Tu preoperacional se realizará <strong>automáticamente todos los días a las 6:00 AM</strong>. Recibirás un correo con la evidencia cada mañana.</p>
          <p style="color:#94a3b8;">Tu período gratuito termina el: <strong style="color:#f8fafc;">${fechaFin}</strong></p>
        </div>

        <div style="background:#1e293b;border-radius:12px;padding:24px;margin:24px 0;">
          <h2 style="color:#f59e0b;margin-top:0;">💳 Plan Mensual — $10.000 COP</h2>
          <p>Después del trial, tu suscripción es de solo <strong>$10.000 pesos al mes</strong> para seguir disfrutando de la automatización diaria.</p>
          <p style="color:#94a3b8;">Te avisaremos 24 horas antes de que expire tu trial con instrucciones de pago.</p>
        </div>

        <p style="color:#64748b;font-size:14px;text-align:center;">Nova 360 Automation — Grupo Conectar © 2026</p>
      </div>
    `
  });
}

// Email de aviso: 1 día antes de que expire el trial
async function sendTrialExpiryWarningEmail(user, paymentLink) {
  const linkHtml = paymentLink
    ? `<a href="${paymentLink}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1.05rem;margin-bottom:1rem;">💳 Pagar con MercadoPago — $10.000</a>`
    : '';

  await transporter.sendMail({
    from: `"Nova 360 Automation" <${CONFIG_SMTP.user}>`,
    to: user.email,
    subject: `⚠️ Tu trial vence mañana — Renueva por $10.000/mes`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:40px;border-radius:16px;">
        <h1 style="color:#f59e0b;">⚠️ ${user.nombre}, tu trial vence mañana</h1>
        <p>Tu período gratuito de 5 días termina <strong>mañana</strong>. Renueva para seguir con la automatización diaria.</p>
        
        <div style="text-align:center;margin:32px 0;">
          ${linkHtml}
        </div>

        <div style="background:#1e293b;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#38bdf8;margin-top:0;">📱 También puedes pagar por Nequi o Daviplata</h3>
          <p style="font-size:1.1rem;">Número: <strong style="color:#f8fafc;">3136174267</strong></p>
          <p>Nombre: <strong>Deiner Mena</strong></p>
          <p style="color:#94a3b8;font-size:0.9rem;">Envía el comprobante de pago a <strong>deinermena25@gmail.com</strong> con tu nombre y cédula para activar tu cuenta manualmente.</p>
        </div>
        <p style="color:#64748b;font-size:14px;text-align:center;">Nova 360 Automation © 2026</p>
      </div>
    `
  });
}

// Email de suscripción expirada con opciones de pago
async function sendExpiredEmail(user, paymentLink) {
  const linkHtml = paymentLink
    ? `<div style="text-align:center;margin:32px 0;"><a href="${paymentLink}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1.1rem;">💳 Pagar con MercadoPago — $10.000</a></div>`
    : '';

  await transporter.sendMail({
    from: `"Nova 360 Automation" <${CONFIG_SMTP.user}>`,
    to: user.email,
    subject: `❌ Tu automatización fue pausada — Reactiva tu suscripción`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:40px;border-radius:16px;">
        <h1 style="color:#ef4444;">❌ ${user.nombre}, tu automatización fue pausada</h1>
        <p>Tu suscripción expiró. El preoperacional automático está pausado temporalmente.</p>
        
        ${linkHtml}

        <div style="background:#1e293b;border-radius:12px;padding:24px;margin:24px 0;">
          <h3 style="color:#38bdf8;margin-top:0;">📱 Pago por Nequi o Daviplata</h3>
          <p style="font-size:1.1rem;">Número: <strong style="color:#f8fafc;">3136174267</strong></p>
          <p>Nombre: <strong>Deiner Mena</strong></p>
          <p style="color:#94a3b8;font-size:0.9rem;">Envía el comprobante a <strong>deinermena25@gmail.com</strong> con tu nombre y cédula.</p>
        </div>

        <p style="color:#64748b;font-size:14px;text-align:center;">Nova 360 Automation © 2026</p>
      </div>
    `
  });
}

// Email de evidencia diaria
async function sendEvidenceEmail(user, screenshot, success = true) {
  const attachments = [];
  const fs = require('fs');
  if (fs.existsSync(screenshot)) attachments.push({ path: screenshot });

  const subject = success
    ? `✅ Preoperacional Exitoso — ${user.nombre} — ${new Date().toLocaleDateString('es-CO')}`
    : `❌ Error en Preoperacional — ${user.nombre}`;

  const html = success
    ? `<div style="font-family:sans-serif;padding:20px;background:#0f172a;color:#f8fafc;border-radius:12px;">
        <h2 style="color:#22c55e;">✅ Preoperacional completado</h2>
        <p><strong>Usuario:</strong> ${user.nombre}</p>
        <p><strong>Placa:</strong> ${user.placa}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
        <p>La captura de pantalla del formulario enviado se adjunta a este correo.</p>
      </div>`
    : `<div style="font-family:sans-serif;padding:20px;background:#0f172a;color:#f8fafc;border-radius:12px;">
        <h2 style="color:#ef4444;">❌ Error en el preoperacional</h2>
        <p>Hubo un problema al procesar el formulario de <strong>${user.nombre}</strong>.</p>
        <p>Se adjunta la captura del error para revisión.</p>
      </div>`;

  try {
    await transporter.sendMail({
      from: `"Nova 360 Automation" <${CONFIG_SMTP.user}>`,
      to: user.email,
      subject,
      html,
      attachments
    });
    console.log(`📧 Evidencia enviada a ${user.email}`);
  } catch (e) {
    console.error(`❌ Error enviando correo a ${user.email}:`, e.message);
  }
}

module.exports = { sendWelcomeEmail, sendTrialExpiryWarningEmail, sendExpiredEmail, sendEvidenceEmail };
