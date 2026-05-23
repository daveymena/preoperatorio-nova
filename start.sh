#!/bin/sh

# Configurar variables de entorno
export NODE_ENV=production
export TZ=America/Bogota

# Crear directorio de logs si no existe
mkdir -p /app/logs

# Función para manejar errores
handle_error() {
  echo "❌ Error: $1"
  exit 1
}

# Iniciar el servidor de Next.js en segundo plano
echo "🚀 Iniciando Servidor Web (Next.js)..."
npm start > /app/logs/nextjs.log 2>&1 &
NEXT_PID=$!

# Esperar a que Next.js esté listo
echo "⏳ Esperando a que Next.js esté listo..."
sleep 5

# Verificar que Next.js está corriendo
if ! kill -0 $NEXT_PID 2>/dev/null; then
  handle_error "Next.js no se inició correctamente"
fi

echo "✅ Servidor Web iniciado (PID: $NEXT_PID)"

# Iniciar el sistema con reactivación automática y scheduler
echo "📅 Iniciando Sistema de Automatización..."
node startup.js > /app/logs/scheduler.log 2>&1 &
SCHEDULER_PID=$!

echo "✅ Scheduler iniciado (PID: $SCHEDULER_PID)"

# Función para limpiar procesos al salir
cleanup() {
  echo "🛑 Recibida señal de terminación, limpiando..."
  kill $NEXT_PID 2>/dev/null
  kill $SCHEDULER_PID 2>/dev/null
  wait
  exit 0
}

# Configurar traps para señales
trap cleanup SIGTERM SIGINT

# Mantener el script corriendo
wait
