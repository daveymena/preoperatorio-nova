export default async function handler(req, res) {
  const { run, get } = require('../../lib/db');
  const { sendWelcomeEmail } = require('../../lib/emails');
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    cedula, nombre, placa, email, password, supervisor,
    km_actual, vacaciones_inicio, vacaciones_fin
  } = req.body;

  if (!cedula || !nombre || !placa || !password || !email) {
    return res.status(400).json({ message: 'Todos los campos obligatorios son requeridos (Cédula, Nombre, Placa, Email, Contraseña)' });
  }

  const trialStart = new Date().toISOString();
  const trialEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 días

  try {
    const existing = await get(`SELECT id FROM users WHERE cedula = ?`, [cedula]);
    if (existing) {
      return res.status(400).json({ message: 'Esta cédula ya está registrada en el sistema.' });
    }

    const result = await run(`
      INSERT INTO users (cedula, nombre, placa, email, password, supervisor, km_actual, vacaciones_inicio, vacaciones_fin, trial_start, subscription_status, subscription_until, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial', ?, 1)
    `, [cedula, nombre, placa, email, password, supervisor || 'eduardo Villareal', km_actual || 0, vacaciones_inicio || null, vacaciones_fin || null, trialStart, trialEnd]);

    // Enviar correo de bienvenida
    const user = { nombre, placa, cedula, email, supervisor: supervisor || 'eduardo Villareal' };
    sendWelcomeEmail(user, trialEnd).catch(e => console.error('Error enviando bienvenida:', e.message));

    res.status(201).json({
      message: 'Registro exitoso',
      id: result.id,
      trial_end: trialEnd
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar: ' + error.message });
  }
}
