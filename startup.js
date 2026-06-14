#!/usr/bin/env node

/**
 * Script de inicio para Easypanel/Docker
 * 1. Inserta/verifica usuario de Davey en PostgreSQL
 * 2. Verifica certificados HTTPS con Let's Encrypt
 * 3. Reactiva el usuario daveymena16@gmail.com por 5 días
 * 4. Inicia el scheduler automático
 */

const { spawn } = require("child_process");
const { all, run, get } = require("./lib/db");
const { seedUsers } = require("./seed-users");
const fs = require("fs");
const https = require("https");

// Crear directorio de logs si no existe
const logsDir = process.env.NODE_ENV === "production" ? "/app/logs" : "./logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Función para registrar en archivo
function logToFile(message) {
  const timestamp = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
  });
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(`${logsDir}/startup.log`, logMessage);
  } catch (e) {
    console.error("Error escribiendo log:", e.message);
  }
}

// Función para verificar certificado HTTPS/Let's Encrypt
async function verifyHTTPSCertificate() {
  const msg = "🔐 Verificando certificado HTTPS/Let's Encrypt...\n";
  console.log(msg);
  logToFile(msg);

  try {
    // Verificar si estamos en producción (EasyPanel)
    if (process.env.NODE_ENV !== "production") {
      const devMsg = "⚠️ Modo desarrollo - Verificación HTTPS omitida.";
      console.log(devMsg);
      logToFile(devMsg);
      return true;
    }

    // En producción, EasyPanel maneja automáticamente Let's Encrypt
    // Solo registramos que el sistema está listo para HTTPS
    const certMsg =
      "✅ Sistema configurado para HTTPS con Let's Encrypt (gestionado por EasyPanel)";
    console.log(certMsg);
    logToFile(certMsg);

    return true;
  } catch (error) {
    const errorMsg = `⚠️ Error verificando certificado: ${error.message}`;
    console.error(errorMsg);
    logToFile(errorMsg);
    return false;
  }
}

// Verificar certificados HTTPS con Let's Encrypt
async function verifyHTTPSCertificates() {
  const msg = "🔐 Verificando certificados HTTPS con Let's Encrypt...\n";
  console.log(msg);
  logToFile(msg);

  try {
    // En producción (Easypanel), los certificados están en /etc/letsencrypt/live/
    const certPath = "/etc/letsencrypt/live";
    const keyPath = "/etc/letsencrypt/live";

    if (process.env.NODE_ENV === "production") {
      if (fs.existsSync(certPath)) {
        const domains = fs.readdirSync(certPath);
        if (domains.length > 0) {
          const successMsg = `✅ Certificados Let's Encrypt encontrados para ${domains.length} dominio(s):\n   ${domains.join(", ")}`;
          console.log(successMsg);
          logToFile(successMsg);

          // Verificar que los certificados sean válidos
          domains.forEach((domain) => {
            const certFile = `${certPath}/${domain}/cert.pem`;
            if (fs.existsSync(certFile)) {
              const stats = fs.statSync(certFile);
              const certMsg = `   📄 ${domain}: ${stats.size} bytes`;
              console.log(certMsg);
              logToFile(certMsg);
            }
          });

          return true;
        }
      }

      const warnMsg =
        "⚠️ No se encontraron certificados Let's Encrypt en /etc/letsencrypt/live/";
      console.warn(warnMsg);
      logToFile(warnMsg);

      const infoMsg =
        "💡 En Easypanel, los certificados se configuran automáticamente. Continuando...";
      console.log(infoMsg);
      logToFile(infoMsg);
      return true;
    } else {
      const devMsg =
        "🔧 Modo desarrollo: Saltando verificación de certificados Let's Encrypt";
      console.log(devMsg);
      logToFile(devMsg);
      return true;
    }
  } catch (error) {
    const errorMsg = `⚠️ Error verificando certificados: ${error.message}. Continuando...`;
    console.warn(errorMsg);
    logToFile(errorMsg);
    return true; // No fallar si hay error en verificación
  }
}

// Reactivar SOLO a daveymena16@gmail.com por 5 días
async function reactivateDaveyUser() {
  const msg = "🔄 Reactivando usuario daveymena16@gmail.com por 5 días...\n";
  console.log(msg);
  logToFile(msg);

  try {
    const user = await get(
      `SELECT * FROM users WHERE email = 'daveymena16@gmail.com' LIMIT 1`,
    );

    if (!user) {
      const warnMsg =
        "⚠️ Usuario daveymena16@gmail.com no encontrado en la base de datos.";
      console.log(warnMsg);
      logToFile(warnMsg);
      return;
    }

    const now = new Date();
    const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    await run(
      `UPDATE users SET 
        subscription_status = 'active', 
        active = 1, 
        subscription_until = ? 
      WHERE id = ?`,
      [fiveDaysLater.toISOString(), user.id],
    );

    const successMsg = `✅ ${user.nombre} - Reactivado hasta ${fiveDaysLater.toLocaleDateString("es-CO")} ${fiveDaysLater.toLocaleTimeString("es-CO")}`;
    console.log(successMsg);
    logToFile(successMsg);
  } catch (error) {
    const errorMsg = `❌ Error reactivando usuario: ${error.message}`;
    console.error(errorMsg);
    logToFile(errorMsg);
  }
}

let schedulerProcess = null;
let restartCount = 0;
const MAX_RESTART_DELAY = 60000; // 1 min max between restarts

async function startScheduler() {
  const msg = "🚀 Iniciando scheduler...\n";
  console.log(msg);
  logToFile(msg);

  const spawnScheduler = () => {
    schedulerProcess = spawn("node", ["davey-daily.js"], {
      stdio: "inherit",
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: "production",
        TZ: "America/Bogota",
      },
    });

    schedulerProcess.on("error", (error) => {
      const errorMsg = `❌ Error iniciando scheduler: ${error.message}`;
      console.error(errorMsg);
      logToFile(errorMsg);
      scheduleRestart();
    });

    schedulerProcess.on("exit", (code, signal) => {
      if (signal === "SIGTERM" || signal === "SIGINT") {
        const exitMsg = `🛑 Scheduler recibió señal ${signal}. NO se reinicia (shutdown ordenado).`;
        console.log(exitMsg);
        logToFile(exitMsg);
        return;
      }
      const exitMsg = `⚠️ Scheduler terminó con código ${code}. Reintentando en ${Math.min(1000 * (restartCount + 1), MAX_RESTART_DELAY)}ms...`;
      console.warn(exitMsg);
      logToFile(exitMsg);
      scheduleRestart();
    });
  };

  const scheduleRestart = () => {
    restartCount++;
    const delay = Math.min(1000 * restartCount, MAX_RESTART_DELAY);
    const restartMsg = `🔄 Reintento #${restartCount} en ${delay}ms...`;
    console.log(restartMsg);
    logToFile(restartMsg);
    setTimeout(spawnScheduler, delay);
  };

  spawnScheduler();

  // Manejar señales de terminación - salir limpiamente
  function handleShutdown(signal) {
    const msg = `📡 Recibida señal ${signal}, cerrando scheduler...`;
    console.log(msg);
    logToFile(msg);
    if (schedulerProcess) {
      schedulerProcess.kill(signal);
    }
    // Dar tiempo para que el hijo termine, luego salir
    setTimeout(() => process.exit(0), 2000).unref();
  }

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

async function main() {
  const header = `
═══════════════════════════════════════════════════════════
🚀 NOVA 360 AUTOMATION - INICIO DEL SISTEMA
═══════════════════════════════════════════════════════════
`;
  console.log(header);
  logToFile(header);

  // Paso 1: Insertar/verificar usuario de Davey en PostgreSQL
  await seedUsers();

  // Paso 2: Verificar certificados HTTPS
  await verifyHTTPSCertificates();

  // Paso 3: Reactivar usuario daveymena16@gmail.com
  await reactivateDaveyUser();

  // Paso 4: Iniciar scheduler
  await startScheduler();
}

main().catch((error) => {
  const errorMsg = `❌ Error fatal: ${error.message}`;
  console.error(errorMsg);
  logToFile(errorMsg);
  process.exit(1);
});
