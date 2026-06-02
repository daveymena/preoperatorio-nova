#!/bin/bash

# Script para verificar usuarios en PostgreSQL desde EasyPanel
# Ejecutar esto DENTRO del contenedor de EasyPanel

echo "═══════════════════════════════════════════════════════════"
echo "🔍 VERIFICANDO USUARIOS EN POSTGRESQL (EASYPANEL)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar que estamos en producción
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️ ADVERTENCIA: No estás en producción (NODE_ENV != production)"
    echo ""
fi

# Mostrar información de conexión
echo "📊 Base de datos configurada:"
echo "   $DATABASE_URL"
echo ""

# Ejecutar script de Node.js
echo "🚀 Ejecutando script de verificación..."
echo ""

node list-postgres-users.js

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Verificación completada"
echo "═══════════════════════════════════════════════════════════"
