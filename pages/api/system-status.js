/**
 * API para obtener el estado del sistema
 */

import { all, get } from '../../lib/db-esm.js';
import fs from 'fs';
import { execSync } from 'child_process';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';

  try {
    // Verificar servidor web
    const webServer = 'ok'; // Si llegamos aquí, el servidor está activo

    // Verificar scheduler
    let scheduler = 'error';
    try {
      const schedulerLog = `${logsDir}/scheduler.log`;
      if (fs.existsSync(schedulerLog)) {
        const content = fs.readFileSync(schedulerLog, 'utf8');
        const lines = content.split('\n');
        const lastLine = lines[lines.length - 2]; // Última línea no vacía
        if (lastLine && lastLine.includes('Scheduler activo')) {
          scheduler = 'ok';
        }
      }
    } catch (e) {
      scheduler = 'warning';
    }

    // Verificar base de datos
    let database = 'error';
    let usersTotal = 0;
    let usersActive = 0;
    try {
      const users = await all(`SELECT * FROM users`);
      const activeUsers = await all(`SELECT * FROM users WHERE active = 1`);
      database = 'ok';
      usersTotal = users.length;
      usersActive = activeUsers.length;
    } catch (e) {
      database = 'error';
    }

    // Verificar G4F
    let g4f = 'warning'; // Por defecto warning, ya que requiere Python
    try {
      // Intentar importar G4F
      execSync('python3 -c "from g4f.client import Client; print(\'ok\')"', { timeout: 5000 });
      g4f = 'ok';
    } catch (e) {
      g4f = 'warning'; // G4F no está disponible pero el sistema puede funcionar sin él
    }

    // Obtener última ejecución
    let lastExecution = null;
    try {
      const lastRun = await get(`SELECT last_run FROM users WHERE last_run IS NOT NULL ORDER BY last_run DESC LIMIT 1`);
      if (lastRun) {
        lastExecution = lastRun.last_run;
      }
    } catch (e) {
      // Ignorar error
    }

    // Calcular próxima ejecución (mañana a las 6 AM)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    const nextExecution = tomorrow.toISOString();

    return res.status(200).json({
      webServer,
      scheduler,
      database,
      g4f,
      lastExecution,
      nextExecution,
      usersActive,
      usersTotal
    });
  } catch (error) {
    console.error('Error obteniendo estado del sistema:', error);
    return res.status(500).json({
      message: 'Error obteniendo estado del sistema',
      error: error.message
    });
  }
}
