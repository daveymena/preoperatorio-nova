/**
 * API endpoint para verificar estado de ejecución diaria de daveymena16@gmail.com
 * GET /api/daily-execution-status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const status = {
      timestamp: new Date().toISOString(),
      timezone: 'America/Bogota',
      dailyExecution: {
        user: 'daveymena16@gmail.com',
        scheduled: true,
        executionWindow: '6:00 AM - 12:00 PM (Colombia)',
        retryInterval: 'Cada hora',
        lastExecution: null,
        nextExecution: null,
        logs: []
      }
    };

    // Leer logs del scheduler
    const schedulerLogPath = path.join(logsDir, 'scheduler.log');
    if (fs.existsSync(schedulerLogPath)) {
      try {
        const logContent = fs.readFileSync(schedulerLogPath, 'utf-8');
        const lines = logContent.split('\n').filter(l => l.trim());
        
        // Obtener últimas 20 líneas de logs
        status.dailyExecution.logs = lines.slice(-20);

        // Buscar última ejecución exitosa
        const successLines = lines.filter(l => l.includes('✅ Ejecución completada'));
        if (successLines.length > 0) {
          status.dailyExecution.lastExecution = successLines[successLines.length - 1];
        }

        // Buscar próxima ejecución programada
        const today = new Date();
        const nextHour = new Date(today);
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        
        // Si ya pasó las 12:00 PM, la próxima es mañana a las 6:00 AM
        if (nextHour.getHours() > 12) {
          nextHour.setDate(nextHour.getDate() + 1);
          nextHour.setHours(6, 0, 0, 0);
        }
        
        status.dailyExecution.nextExecution = nextHour.toISOString();
      } catch (e) {
        status.dailyExecution.logsError = e.message;
      }
    }

    // Leer logs del worker
    const workerLogPath = path.join(logsDir, 'worker.log');
    if (fs.existsSync(workerLogPath)) {
      try {
        const logContent = fs.readFileSync(workerLogPath, 'utf-8');
        const lines = logContent.split('\n').filter(l => l.trim());
        
        // Obtener últimas 10 líneas de ejecución del worker
        status.dailyExecution.workerLogs = lines.slice(-10);
      } catch (e) {
        status.dailyExecution.workerLogsError = e.message;
      }
    }

    return res.status(200).json(status);
  } catch (error) {
    return res.status(500).json({
      error: 'Error verificando estado de ejecución diaria',
      message: error.message
    });
  }
}
