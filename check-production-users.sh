#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "🔍 VERIFICACIÓN DE USUARIOS EN PRODUCCIÓN"
echo "════════════════════════════════════════════════════════"
echo ""

# Verificar tipo de base de datos
if [ -n "$DATABASE_URL" ]; then
    echo "📊 Base de datos: PostgreSQL"
    echo "🔗 URL: ${DATABASE_URL:0:30}..."
else
    echo "📊 Base de datos: SQLite"
    echo "📁 Archivo: database.sqlite"
fi

echo ""
echo "────────────────────────────────────────────────────────"
echo "👥 LISTANDO USUARIOS..."
echo "────────────────────────────────────────────────────────"
echo ""

# Ejecutar el script de listado
node list-all-users.js

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ VERIFICACIÓN COMPLETADA"
echo "════════════════════════════════════════════════════════"
