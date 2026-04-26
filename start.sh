#!/bin/sh

# Iniciar el servidor de Next.js en segundo plano
echo "🚀 Iniciando Servidor Web (Next.js)..."
npm start &

# Iniciar el programador de tareas (Scheduler) en primer plano para mantener el contenedor vivo
echo "📅 Iniciando Scheduler de Preoperacionales..."
npm run worker
