#!/usr/bin/env bash
# Script para iniciar el laboratorio en macOS / Linux
echo "================================================================"
echo " INICIANDO LABORATORIO VIRTUAL DE OSCILACIONES"
echo "================================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ [ERROR] Node.js no está instalado. Descárgalo desde https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "📦 [INFO] Instalando dependencias de Node.js por primera vez..."
    npm install
fi

echo "🚀 [INFO] Iniciando servidor y abriendo en navegador..."
npx vite --open
