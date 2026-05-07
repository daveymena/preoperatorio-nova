#!/bin/sh

# Iniciar el servidor de Next.js en segundo plano
echo "🚀 Iniciando Servidor Web (Next.js)..."
npm start &

# Esperar un momento para que Next.js inicie
sleep 3

# Iniciar el sistema con reactivación automática y scheduler
echo "📅 Iniciando Sistema de Automatización..."
node startup.js
