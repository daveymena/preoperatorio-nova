import { get } from '../../lib/db-esm.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { cedula, email } = req.body;
  if (!cedula && !email) {
    return res.status(400).json({ message: 'Se requiere cédula o email' });
  }

  try {
    const user = await get(
      `SELECT * FROM users WHERE cedula = ? OR email = ?`,
      [cedula || '', email || '']
    );

    if (!user) {
      return res.status(200).json({ found: false });
    }

    const now = new Date();
    const trialEnd = user.subscription_until ? new Date(user.subscription_until) : null;
    let daysLeft = 0;
    if (trialEnd) {
      daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    }

    // Duvier siempre gratis
    const esDuvier = user.cedula === '1077449318';
    const status = user.subscription_status;
    let state;
    if (esDuvier) {
      state = 'active';
    } else if (status === 'active') {
      if (trialEnd && trialEnd < now) {
        state = 'expired';
      } else {
        state = 'active';
      }
    } else if (status === 'trial') {
      if (daysLeft <= 0) {
        state = 'expired';
      } else if (daysLeft <= 3) {
        state = 'trial_expiring';
      } else {
        state = 'trial';
      }
    } else {
      state = 'expired';
    }

    return res.status(200).json({
      found: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        placa: user.placa,
        email: user.email,
        cedula: user.cedula,
      },
      subscription: {
        state,
        status,
        daysLeft: daysLeft > 0 ? daysLeft : 0,
        trialEnd: trialEnd ? trialEnd.toISOString() : null,
        active: user.active === 1,
      },
    });
  } catch (error) {
    console.error('Error en check-subscription:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}
