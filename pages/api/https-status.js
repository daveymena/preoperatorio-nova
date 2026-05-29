/**
 * API endpoint para verificar estado de certificados HTTPS y Let's Encrypt
 * GET /api/https-status
 */

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      https: {
        enabled: process.env.NODE_ENV === 'production',
        letsencrypt: {
          configured: false,
          domains: [],
          certificates: []
        }
      }
    };

    // En producción, verificar certificados Let's Encrypt
    if (process.env.NODE_ENV === 'production') {
      const certPath = '/etc/letsencrypt/live';
      
      if (fs.existsSync(certPath)) {
        try {
          const domains = fs.readdirSync(certPath);
          status.https.letsencrypt.configured = domains.length > 0;
          status.https.letsencrypt.domains = domains;

          // Obtener información de cada certificado
          domains.forEach(domain => {
            const certFile = path.join(certPath, domain, 'cert.pem');
            const keyFile = path.join(certPath, domain, 'privkey.pem');
            
            if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
              const certStats = fs.statSync(certFile);
              const keyStats = fs.statSync(keyFile);
              
              status.https.letsencrypt.certificates.push({
                domain,
                certSize: certStats.size,
                keySize: keyStats.size,
                certModified: certStats.mtime,
                keyModified: keyStats.mtime,
                valid: true
              });
            }
          });
        } catch (e) {
          status.https.letsencrypt.error = e.message;
        }
      }
    } else {
      status.https.letsencrypt.note = 'Modo desarrollo: certificados no verificados';
    }

    return res.status(200).json(status);
  } catch (error) {
    return res.status(500).json({
      error: 'Error verificando estado HTTPS',
      message: error.message
    });
  }
}
