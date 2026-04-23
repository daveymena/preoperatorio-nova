const { run, get } = require('../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { id, months = 1 } = req.body;
  if (!id) return res.status(400).json({ message: 'Missing user ID' });

  try {
    const user = await get(`SELECT * FROM users WHERE id = ?`, [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    // Si ya tiene suscripción activa, extender desde la fecha de vencimiento
    const base = (user.subscription_until && new Date(user.subscription_until) > now)
      ? new Date(user.subscription_until)
      : now;

    const newUntil = new Date(base);
    newUntil.setDate(newUntil.getDate() + (months * 30));

    await run(
      `UPDATE users SET subscription_status = 'active', subscription_until = ?, active = 1 WHERE id = ?`,
      [newUntil.toISOString(), id]
    );

    res.status(200).json({ message: `✅ Suscripción activada hasta ${newUntil.toLocaleDateString('es-CO')}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al activar: ' + error.message });
  }
}
