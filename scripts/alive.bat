@echo off
rem alive: lo levanta (si no esta corriendo) y lo abre en el navegador.
setlocal
cd /d "%~dp0.."
set PORT=3333
set URL=http://localhost:%PORT%

call :running
if %errorlevel%==0 goto open

if not exist "data" mkdir data
if not exist ".next\BUILD_ID" (
  echo Compilando alive por primera vez, toma un minuto...
  call npm run build
  if errorlevel 1 (
    echo La compilacion fallo. Revisa los mensajes de arriba.
    pause
    exit /b 1
  )
)

echo Iniciando alive en %URL% ...
wscript "%~dp0servidor-oculto.vbs"

set /a tries=0
:wait
timeout /t 1 /nobreak >nul
call :running
if %errorlevel%==0 goto open
set /a tries+=1
if %tries% lss 45 goto wait
echo alive no respondio. Revisa data\alive-server.log
pause
exit /b 1

:open
start "" "%URL%"
exit /b 0

:running
curl -s -o nul --max-time 2 "%URL%" >nul 2>&1
exit /b %errorlevel%
