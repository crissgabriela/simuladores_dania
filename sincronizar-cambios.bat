@echo off
title Agente Revisor de Calidad - GitHub y Vercel
chcp 65001 >nul
echo.
call node scripts/verify-and-sync.cjs
echo.
echo ================================================================
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
