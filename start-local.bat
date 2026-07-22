@echo off
setlocal EnableExtensions
title Guia Agile de QA - local

REM Pasta do projeto (funciona com espacos no caminho, ex.: "Cur Sor")
cd /d "%~dp0"
set "APP_DIR=%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
  echo npm nao encontrado. Instale o Node.js e reabra o terminal.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo Falha no npm install.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando Vite em uma janela separada...
echo Aguarde ate aparecer "Local: http://127.0.0.1:5173"
echo.

REM /D define o diretorio de trabalho SEM quebrar aspas em caminhos com espaco.
REM NAO use: cmd /k "cd /d "%~dp0" && ..." — isso parte o path em "Cur Sor".
start "Guia Agile de QA - Vite" /D "%APP_DIR%" cmd /k npm run dev

echo Aguardando HTTP em http://127.0.0.1:5173/ ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\wait-vite-ready.ps1" -Url "http://127.0.0.1:5173/" -TimeoutSec 90
if errorlevel 1 (
  echo.
  echo ERRO: o Vite nao respondeu em http://127.0.0.1:5173
  echo Confira a janela "Guia Agile de QA - Vite" para ver o erro.
  echo Se a porta 5173 estiver ocupada, feche outros Node/Vite e tente de novo.
  pause
  exit /b 1
)

echo Servidor OK. Abrindo o navegador em 127.0.0.1 ^(evita Service Worker antigo de localhost^)...
start "" "http://127.0.0.1:5173/"

echo.
echo Pronto. Mantenha a janela do Vite aberta enquanto usar o app.
echo Jira: /api/jira-proxy ja funciona no Vite ^(nao precisa de vercel dev^).
echo Se ainda ver ERR_FAILED: rode clear-localhost-sw.bat e atualize a pagina.
echo.
pause
