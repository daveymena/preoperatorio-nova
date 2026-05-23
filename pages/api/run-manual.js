/**
 * API para ejecutar preoperacional manualmente
 */

import { get, run } from '../../lib/db-esm.js';
import { processUserImproved } from '../../lib/process-user-improved-esm.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { cedula, email, password } = req.body;

  console.log('🔍 run-manual recibió:', { cedula, email, password: '***' });

  if (!cedula || !email || !password) {
    console.log('❌ Faltan campos');
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }

  try {
    // Buscar usuario
    console.log('🔎 Buscando usuario con cedula:', cedula, 'o email:', email);
    const user = await get(
      `SELECT * FROM users WHERE cedula = ? OR email = ?`,
      [cedula, email]
    );

    console.log('📊 Usuario encontrado:', user ? { id: user.id, cedula: user.cedula, email: user.email } : 'NO');

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña
    console.log('🔐 Verificando contraseña. Esperada:', user.password, 'Recibida:', password);
    if (user.password !== password) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Verificar que el usuario está activo
    if (!user.active) {
      return res.status(403).json({ message: 'Usuario inactivo. Contacta al administrador.' });
    }

    // Ejecutar en background
    processUserImproved(user).catch(err => {
      console.error('Error ejecutando usuario:', err);
    });

    return res.status(200).json({
      message: '✅ Preoperacional iniciado. Recibirás la evidencia en tu correo en unos minutos.',
      user: {
        nombre: user.nombre,
        placa: user.placa,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error en run-manual:', error);
    return res.status(500).json({
      message: 'Error ejecutando preoperacional',
      error: error.message
    });
  }
}
