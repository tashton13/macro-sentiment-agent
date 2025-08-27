@echo off

echo ===============================================
echo   NASCENT - Automated GitHub Deployment
echo ===============================================
echo.

:: Add all changes
echo [1/4] Adding changes...
git add .

:: Check if there are changes to commit
git diff --staged --quiet
if %errorlevel% equ 0 (
    echo No changes to commit. Repository is up to date.
    pause
    exit /b 0
)

:: Auto-generate commit message based on what we've been working on
echo [2/4] Generating commit message...
set "commit_msg=Deploy: Latest Updates"

:: Commit changes
echo [3/4] Committing changes...
echo Commit: %commit_msg%
git commit -m "%commit_msg%"

:: Push to GitHub
echo [4/4] Pushing to GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Deployed to GitHub
    echo Live at: https://tashton13.github.io/macro-sentiment-agent/
    echo GitHub Actions will build and deploy automatically
    echo.
    timeout /t 3 >nul
) else (
    echo.
    echo ERROR: Push failed
    echo Check your internet connection and GitHub credentials
    pause
)
