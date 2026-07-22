@echo off
setlocal EnableExtensions
title Remover Service Worker - localhost

echo.
echo Este script ajuda a remover Service Workers antigos do Vite/PWA
echo que causam ERR_FAILED em http://localhost:5173/
echo.
echo Preferencia: use http://127.0.0.1:5173/ ^(start-local.bat ja abre assim^).
echo.

set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME (
  echo Abrindo chrome://serviceworker-internals/
  echo Procure por localhost:5173 e clique em Unregister.
  echo Depois feche as abas de localhost e rode start-local.bat.
  echo.
  start "" "%CHROME%" "chrome://serviceworker-internals/"
) else (
  echo Chrome nao encontrado. Abra manualmente:
  echo   chrome://serviceworker-internals/
  echo e remova o registro de http://localhost:5173
)

echo.
pause
