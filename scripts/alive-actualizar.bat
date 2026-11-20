@echo off
rem Despues de cambiar el codigo: detiene, recompila y vuelve a abrir alive.
setlocal
cd /d "%~dp0.."
call "%~dp0alive-detener.bat"
echo Compilando la nueva version...
call npm run build
if errorlevel 1 (
  echo La compilacion fallo. alive sigue detenido; corrige el error y vuelve a intentar.
  pause
  exit /b 1
)
call "%~dp0alive.bat"
