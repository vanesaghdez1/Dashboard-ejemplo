@echo off
rem Doble clic para levantar la demo (base de datos + API + frontend) y abrir el navegador.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar-demo.ps1" %*
pause
