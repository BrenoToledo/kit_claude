@echo off
rem Padrao do kit: ver docs/padroes/TESTE.md. Nao edite este arquivo; edite test.config.
setlocal
cd /d "%~dp0"
if not exist "test.config" (
  echo test.config nao encontrado ao lado do test.bat.
  exit /b 1
)
if exist ".venv\Scripts\activate.bat" call ".venv\Scripts\activate.bat"
for /f "usebackq eol=# tokens=* delims=" %%L in ("test.config") do (
  echo.
  echo ^> %%L
  call %%L
  if errorlevel 1 (
    echo.
    echo FALHOU: %%L
    exit /b 1
  )
)
echo.
echo Todos os comandos de teste passaram.
exit /b 0
