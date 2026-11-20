@echo off
rem Hace que el servidor de alive arranque solo, sin ventanas, al iniciar sesion en Windows.
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
> "%STARTUP%\alive.vbs" echo CreateObject("WScript.Shell").Run "wscript ""%~dp0servidor-oculto.vbs""", 0, False
echo Listo: alive arrancara solo cada vez que inicies sesion.
echo Para quitarlo, ejecuta quitar-inicio.bat
pause
