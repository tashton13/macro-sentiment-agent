@echo off
echo Auto-upload running for tashton13/macro-sentiment-agent
echo Press Ctrl+C to stop
echo.

:loop
timeout /t 5 /nobreak >nul
git add .
git diff --cached --quiet
if errorlevel 1 (
    echo [%time%] Changes detected! Uploading to GitHub...
    git commit -m "Auto-update: %date% %time%"
    git push origin main
    echo [%time%] ✓ Uploaded to https://github.com/tashton13/macro-sentiment-agent
    echo.
)
goto loop