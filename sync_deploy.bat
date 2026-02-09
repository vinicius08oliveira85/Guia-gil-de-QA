@echo off
echo ==========================================
echo   Sincronizacao e Deploy - QA Agile Guide
echo ==========================================

echo.
echo [1/3] Sincronizando com a main remota (Rebase)...
call git pull origin main --rebase
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha no git pull. Resolva os conflitos manualmente e rode o script novamente.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Enviando alteracoes para o GitHub...
call git push origin main

echo.
echo [3/3] Forcando deploy de producao na Vercel...
call vercel --prod

echo.
echo ==========================================
echo   Processo Finalizado!
echo ==========================================
pause