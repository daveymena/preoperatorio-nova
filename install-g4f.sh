#!/bin/bash

# Script de instalación de G4F
# Instala G4F y todas sus dependencias

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          🚀 INSTALACIÓN DE G4F (gpt4free)               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Verificar que Python está instalado
echo "🔍 Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado"
    echo "   Instala Python 3 desde https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Python $PYTHON_VERSION encontrado"
echo ""

# Verificar pip
echo "🔍 Verificando pip..."
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 no está instalado"
    echo "   Instala pip con: python3 -m ensurepip --upgrade"
    exit 1
fi

echo "✅ pip3 encontrado"
echo ""

# Instalar G4F
echo "📦 Instalando G4F..."
pip3 install g4f

if [ $? -ne 0 ]; then
    echo "❌ Error instalando G4F"
    exit 1
fi

echo "✅ G4F instalado correctamente"
echo ""

# Instalar dependencias opcionales
echo "📦 Instalando dependencias opcionales..."
pip3 install g4f[webdriver]

echo "✅ Dependencias instaladas"
echo ""

# Verificar instalación
echo "🔍 Verificando instalación..."
python3 -c "from g4f.client import Client; print('✅ G4F está listo para usar')"

if [ $? -ne 0 ]; then
    echo "❌ Error verificando G4F"
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          ✅ INSTALACIÓN COMPLETADA                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Próximos pasos:"
echo "1. Configura las variables de entorno:"
echo "   export G4F_MODEL=gpt-4-turbo"
echo "   export G4F_PROVIDER=auto"
echo ""
echo "2. Prueba G4F:"
echo "   npm run test-analyzer-g4f"
echo ""
echo "3. Verifica el sistema:"
echo "   npm run verify-g4f"
echo ""
