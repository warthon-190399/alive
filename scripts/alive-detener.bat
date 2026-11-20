@echo off
rem Detiene el servidor de alive.
set PORT=3333
set FOUND=
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do (
  taskkill /PID %%p /T /F >nul 2>&1
  set FOUND=1
)
if defined FOUND (echo alive detenido.) else (echo alive no estaba corriendo.)
