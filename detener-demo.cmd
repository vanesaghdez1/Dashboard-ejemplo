@echo off
rem Doble clic para apagar la demo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\detener-demo.ps1" %*
pause
