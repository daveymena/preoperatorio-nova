/**
 * API para insertar usuario de Davey manualmente
 * Acceso: GET /api/seed-user
 */

import { get, run } from '../../lib/db-esm.js';

export default async function handler(req, res) {
  try {
    console.log('🌱 Verificando usuario de Davey...');

    // Verificar si el usuario ya existe
    const existingUser = await get(
      'SELECT * FROM users WHERE email = ?',
      ['daveymena16@gmail.com']
    );

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'Usuario ya existe',
        user: {
          id: existingUser.id,
          nombre: existingUser.nombre,
          email: existingUser.email,
          cedula: existingUser.cedula,
          placa: existingUser.placa,
          km_actual: existingUser.km_actual,
          active: existingUser.active,
          subscription_until: existingUser.subscription_until
        }
      });
    }

    // Insertar usuario de Davey
    console.log('📝 Insertando usuario de Davey...');

    // Calcular fecha de expiración (10 años = permanente)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 10);

    const result = await run(
      `INSERT INTO users (
        cedula, nombre, placa, email, password, supervisor, km_actual,
        telefono, direccion, ciudad, departamento, empresa, cargo,
        vacaciones_inicio, vacaciones_fin, active, last_run,
        trial_start, subscription_status, subscription_until, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '1077449318',
        'Duvier Prueba',
        'TEST-99',
        'daveymena16@gmail.com',
        '1077449318',
        'Eduardo Villareal',
        532,
        '3000000000',
        'Calle Principal 123',
        'Bogotá',
        'Cundinamarca',
        'Conectar TV',
        'Conductor',
        null,
        null,
        1, // active
        new Date().toISOString(),
        new Date().toISOString(),
        'premium', // PREMIUM - No expira nunca
        expiryDate.toISOString(), // 10 años = permanente
        new Date().toISOString()
      ]
    );

    // Obtener el usuario insertado
    const insertedUser = await get(
      'SELECT * FROM users WHERE email = ?',
      ['daveymena16@gmail.com']
    );

    return res.status(200).json({
      success: true,
      message: 'Usuario insertado exitosamente',
      user: {
        id: insertedUser.id,
        nombre: insertedUser.nombre,
        email: insertedUser.email,
        cedula: insertedUser.cedula,
        placa: insertedUser.placa,
        km_actual: insertedUser.km_actual,
        active: insertedUser.active,
        subscription_until: insertedUser.subscription_until,
        created_at: insertedUser.created_at
      }
    });
  } catch (error) {
    console.error('❌ Error insertando usuario:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
