@echo off
rem Quita el arranque automatico de alive.
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
if exist "%STARTUP%\alive.vbs" (
  del "%STARTUP%\alive.vbs"
  echo Listo: alive ya no arrancara solo.
) else (
  echo alive no estaba en el inicio de Windows.
)
pause
