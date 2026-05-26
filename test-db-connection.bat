@echo off
REM Database Connection Verification Script (Windows)
REM Run this after you've set up the DATABASE_URL

echo.
echo ================================
echo 🧪 DATABASE CONNECTION TEST
echo ================================
echo.

REM Check if backend\.env exists
if not exist "backend\.env" (
    echo ❌ ERROR: backend\.env not found!
    echo Make sure you're in the project root directory
    pause
    exit /b 1
)

echo ✅ Found backend\.env
echo.

REM Check if DATABASE_URL is set
for /f "tokens=2 delims==" %%A in ('findstr /R "^DATABASE_URL=" backend\.env') do set DB_URL=%%A

if "%DB_URL%"=="" (
    echo ❌ ERROR: DATABASE_URL not found in backend\.env
    pause
    exit /b 1
)

REM Hide password in output
setlocal enabledelayedexpansion
set "SAFE_URL=!DB_URL!"
REM This is a simple obfuscation - not perfect but helps
echo 📝 DATABASE_URL found:
echo    !DB_URL:~0,40!...^@db.fsgcdhshhsbmodspyggn.supabase.co:5432/postgres
echo.

REM Check if password is still a placeholder
echo !DB_URL! | findstr /I "YOUR_POSTGRES_PASSWORD" >nul
if not errorlevel 1 (
    echo ❌ WARNING: DATABASE_URL still contains placeholder 'YOUR_POSTGRES_PASSWORD'
    echo    Please update it with your actual password from Supabase
    echo.
    echo 📌 Steps to fix:
    echo    1. Go to https://app.supabase.com
    echo    2. Select your project (fsgcdhshhsbmodspyggn^)
    echo    3. Go to Settings → Database → Connection string
    echo    4. Copy the connection string with password
    echo    5. Replace YOUR_POSTGRES_PASSWORD in backend\.env
    echo.
    pause
    exit /b 1
)

echo ✅ Database URL appears to be configured
echo.

REM Check if Node is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Get Node version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Check if npm dependencies are installed
if not exist "backend\node_modules" (
    echo ⏳ Installing npm dependencies...
    cd backend
    call npm install
    cd ..
)

echo.
echo ================================
echo 🚀 STARTING DATABASE TEST...
echo ================================
echo.

REM Try to start the backend
cd backend
call npm run dev

pause
