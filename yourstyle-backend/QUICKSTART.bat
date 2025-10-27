@echo off
echo ========================================
echo YourStyle Backend Quick Start
echo ========================================
echo.

echo [1/6] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [2/6] Copying environment file...
if not exist .env (
    copy .env.example .env
    echo ✓ .env file created
    echo WARNING: Please edit .env file with your settings before continuing!
    notepad .env
    pause
) else (
    echo ✓ .env file already exists
)
echo.

echo [3/6] Starting Docker containers...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start Docker containers
    echo Please ensure Docker Desktop is running
    pause
    exit /b 1
)
echo ✓ Docker containers started
echo.

echo [4/6] Waiting for PostgreSQL to initialize...
timeout /t 15 /nobreak
echo ✓ Database should be ready
echo.

echo [5/6] Running database migrations...
call npm run migrate
if errorlevel 1 (
    echo ERROR: Failed to run migrations
    pause
    exit /b 1
)
echo ✓ Database tables created
echo.

echo [6/6] Seeding products data...
call npm run seed
if errorlevel 1 (
    echo ERROR: Failed to seed products
    pause
    exit /b 1
)
echo ✓ Products seeded
echo.

echo ========================================
echo Setup Complete! 🎉
echo ========================================
echo.
echo Next steps:
echo 1. Configure Apache (see SETUP.md)
echo 2. Start the backend server with: npm run dev
echo.
echo Press any key to start the backend server now...
pause >nul

echo.
echo Starting backend server...
call npm run dev
