@echo off
REM Windows Startup Script for Cursor
REM This script ensures frontend auto-start on Windows

echo 🚀 KUBOTA RENTAL PLATFORM - WINDOWS STARTUP
echo ===========================================

REM Detect project root
if exist "package.json" (
    if exist "apps\web" (
        set "PROJECT_ROOT=%CD%"
        goto :found_project
    )
)

REM Check dev container
if exist "\workspace\package.json" (
    if exist "\workspace\apps\web" (
        set "PROJECT_ROOT=\workspace"
        goto :found_project
    )
)

REM Check local development
if exist "C:\Users\vscode\Kubota-rental-platform\package.json" (
    if exist "C:\Users\vscode\Kubota-rental-platform\apps\web" (
        set "PROJECT_ROOT=C:\Users\vscode\Kubota-rental-platform"
        goto :found_project
    )
)

REM Fallback - use current directory
set "PROJECT_ROOT=%CD%"
:found_project

echo 📍 Project root: %PROJECT_ROOT%
cd /d "%PROJECT_ROOT%"

REM Check if frontend is running
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend already running on port 3000
    goto :check_backend
)

REM Start frontend
echo 🎯 Starting frontend...
if exist "apps\web\package.json" (
    echo 📦 Using pnpm workspace...
    start "Frontend" cmd /c "pnpm --filter @kubota-rental/web run dev"
    timeout /t 5 /nobreak >nul
) else (
    echo ❌ Frontend not found
)

:check_backend
REM Check if backend is running
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend already running on port 3001
    goto :complete
)

REM Start backend
echo 🎯 Starting backend...
if exist "apps\api\package.json" (
    echo 📦 Using pnpm workspace...
    start "Backend" cmd /c "pnpm --filter @kubota-rental/api run start:dev"
    timeout /t 3 /nobreak >nul
) else (
    echo ❌ Backend not found
)

:complete
echo.
echo 🎉 Development servers startup complete!
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3001
echo 💊 Health:   http://localhost:3001/health
echo.
echo ✅ Windows startup complete!


