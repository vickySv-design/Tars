@echo off
echo ========================================
echo Real-time Chat Application
echo ========================================
echo.

echo Starting Convex backend server...
start "Convex Server" cmd /k "npx convex dev"

echo Waiting 3 seconds for Convex to initialize...
timeout /t 3 /nobreak >nul

echo Starting Next.js development server...
echo.
echo Visit: http://localhost:3000
echo.
npm run dev
