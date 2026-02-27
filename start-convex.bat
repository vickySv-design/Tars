@echo off
echo ========================================
echo Starting Convex Backend
echo ========================================
echo.
echo This will:
echo 1. Login to Convex (or create account)
echo 2. Create a new project
echo 3. Generate types
echo 4. Give you a URL to add to .env.local
echo.
echo IMPORTANT: Keep this terminal running!
echo.
pause

npx convex dev
