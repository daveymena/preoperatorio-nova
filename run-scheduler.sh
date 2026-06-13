#!/bin/bash
# Scheduler launcher - mantiene el scheduler corriendo 24/7
# Se reinicia automáticamente si falla

export NODE_ENV=production
export TZ=America/Bogota
export DATABASE_URL="postgres://postgres:6715320@tecnology_base-open:5432/davey?sslmode=disable"
export PUPPETEER_EXECUTABLE_PATH="/root/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome"

cd /workspace/proyectos/preoperatorio-nova
mkdir -p /workspace/proyectos/preoperatorio-nova/logs

echo "[scheduler] Iniciando Davey Daily Scheduler..."
echo "[scheduler] DB: PostgreSQL / Chrome: $PUPPETEER_EXECUTABLE_PATH"

while true; do
    node davey-daily.js >> /workspace/proyectos/preoperatorio-nova/logs/scheduler-console.log 2>&1
    EXIT_CODE=$?
    echo "[scheduler] Proceso terminó con código $EXIT_CODE. Reiniciando en 5s..." >> /workspace/proyectos/preoperatorio-nova/logs/scheduler-console.log 2>&1
    sleep 5
done
