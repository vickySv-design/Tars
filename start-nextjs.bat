@echo off
echo ========================================
echo Starting Next.js Development Server
echo ========================================
echo.
echo Make sure you have:
echo 1. Run start-convex.bat in another terminal
echo 2. Added NEXT_PUBLIC_CONVEX_URL to .env.local
echo.
echo Then visit: http://localhost:3000
echo.
pause

npm run dev
