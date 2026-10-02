@echo off
title Configuración Inicial del Laboratorio Virtual
chcp 65001 >nul
echo ================================================================
echo  CONFIGURACIÓN INICIAL DEL LABORATORIO VIRTUAL DE OSCILACIONES
echo ================================================================
echo.

echo [1/3] Comprobando Node.js y npm...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js no está instalado en este sistema.
    echo Por favor descárgalo de https://nodejs.org/ e instálalo.
    echo Luego vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)
echo      Node.js detectado correctamente.

echo.
echo [2/3] Instalando paquetes y librerías del proyecto...
echo      (Esto puede tomar unos 30 segundos la primera vez)
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Ocurrió un error durante la instalación de paquetes.
    pause
    exit /b 1
)

echo.
echo [3/3] Verificando compilación de prueba...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Hubo un error de compilación.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo  ¡INSTALACIÓN COMPLETADA CON ÉXITO!
echo ================================================================
echo.
echo ¿Qué hacer ahora?
echo.
echo 1. Para abrir y usar el simulador en tu computadora:
echo    -> Haz doble clic en 'iniciar-laboratorio.bat'
echo.
echo 2. Para revisar y enviar modificaciones a GitHub y Vercel:
echo    -> Haz doble clic en 'sincronizar-cambios.bat'
echo.
echo 3. Para ver la guía completa con ejemplos y el prompt de IA:
echo    -> Abre el archivo 'GUIA_PROFESORA.md'
echo.
pause
