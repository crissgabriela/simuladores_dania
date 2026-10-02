@echo off
title Laboratorio Virtual de Oscilaciones - Iniciando...
chcp 65001 >nul
echo ================================================================
echo  INICIANDO LABORATORIO VIRTUAL DE OSCILACIONES
echo ================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro Node.js instalado en esta computadora.
    echo Por favor descarga e instala Node.js LTS desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Primera ejecucion detectada. Instalando paquetes necesarios...
    echo Esto solo tardara unos momentos...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Hubo un fallo al instalar dependencias con npm.
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Iniciando servidor interactivo en tu navegador web...
echo (Presiona Ctrl+C en esta consola cuando desees cerrar la aplicacion)
echo.
call npx vite --open
pause
