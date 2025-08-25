@echo off
echo Manual upload script for tashton13/macro-sentiment-agent
echo.
git add .
git status
echo.
set /p commit_msg="Enter commit message (or press Enter for auto-message): "
if "%commit_msg%"=="" set commit_msg=Update: %date% %time%
echo.
echo Uploading to GitHub...
git commit -m "%commit_msg%"
git push origin main
echo.
echo ✓ Successfully uploaded to https://github.com/tashton13/macro-sentiment-agent
echo.