@echo off
echo ========================================
echo Testing Million Trains Application
echo ========================================
echo.

echo Step 1: Testing Database Connection...
echo.
call npx ts-node --esm test-db.ts
if %errorlevel% neq 0 (
    echo.
    echo ❌ Database connection test FAILED!
    echo.
    echo Please fix the database connection before testing routes.
    echo Check:
    echo - Is Supabase project active?
    echo - Is DATABASE_URL correct in .env?
    echo - Do tables exist in database?
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Database Connection: PASSED
echo ========================================
echo.

echo Step 2: Starting Dev Server...
echo.
echo The dev server will start in a new window.
echo Once it's running, you can test the routes manually:
echo.
echo Authentication Routes:
echo - POST http://localhost:3000/api/auth/signup
echo - POST http://localhost:3000/api/auth/login
echo - POST http://localhost:3000/api/auth/logout
echo.
echo Train Data Routes:
echo - GET http://localhost:3000/api/train-status?trainNumber=12345
echo - GET http://localhost:3000/api/find-trains?from=NDLS^&to=BCT
echo - GET http://localhost:3000/api/pnr-status?pnrNumber=1234567890
echo - GET http://localhost:3000/api/fare?trainNumber=12345^&fromStationCode=NDLS^&toStationCode=BCT
echo.
echo Contact Route:
echo - POST http://localhost:3000/api/contact
echo.
echo Press any key to start the dev server...
pause > nul

start "Million Trains Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Dev server started in new window!
echo ========================================
echo.
echo You can now:
echo 1. Open http://localhost:3000 in your browser
echo 2. Test signup/login at /signup and /login
echo 3. Test dashboard at /dashboard
echo 4. Use the test-api.bat script to test API routes
echo.
pause
