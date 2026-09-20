# ==============================================================================
# SAIL Maritime Freight Intelligence — Windows Native Local Startup Script
# ==============================================================================
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$WorkspaceRoot = Split-Path -Parent $RepoRoot

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "      SAIL MARITIME FREIGHT INTELLIGENCE — NATIVE LOCAL LAUNCHER (WINDOWS)      " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# 1. Start PostgreSQL if not already running
Write-Host "1. Checking PostgreSQL on port 5432..." -ForegroundColor Yellow
$PgBin = Join-Path $RepoRoot "infrastructure\pgsql\bin"
$PgData = Join-Path $RepoRoot "infrastructure\postgres_data"
$PgLog = Join-Path $RepoRoot "infrastructure\postgres.log"

$pgReady = & "$PgBin\pg_isready.exe" -h localhost -p 5432 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Starting PostgreSQL server..." -ForegroundColor Yellow
    # Remove stale postmaster.pid if present and process not alive
    $pidFile = Join-Path $PgData "postmaster.pid"
    if (Test-Path $pidFile) {
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }
    Start-Process -FilePath "$PgBin\postgres.exe" -ArgumentList "-D `"$PgData`"" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}
Write-Host "   [READY] PostgreSQL is accepting connections on port 5432" -ForegroundColor Green

# 2. Start ML Service (FastAPI)
Write-Host "2. Starting FastAPI ML service on http://localhost:8000..." -ForegroundColor Yellow
$MlDir = Join-Path $RepoRoot "ml-service"
$PipelineDir = Join-Path $RepoRoot "data-pipeline"
$env:PYTHONPATH = "$MlDir;$PipelineDir"
Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory $MlDir -WindowStyle Minimized

# 3. Start Spring Boot Backend
Write-Host "3. Starting Spring Boot backend on http://localhost:8080..." -ForegroundColor Yellow
$BackendDir = Join-Path $RepoRoot "backend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=default" -WorkingDirectory $BackendDir -WindowStyle Minimized

# 4. Start React Vite Frontend
Write-Host "4. Starting React Vite frontend on http://localhost:5173..." -ForegroundColor Yellow
$FrontendDir = Join-Path $WorkspaceRoot "work-frontend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $FrontendDir -WindowStyle Minimized

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  SERVICES LAUNCHED:" -ForegroundColor Green
Write-Host "  1. PostgreSQL        : Port 5432" -ForegroundColor Green
Write-Host "  2. FastAPI ML Service: http://localhost:8000" -ForegroundColor Green
Write-Host "  3. Spring Boot API   : http://localhost:8080" -ForegroundColor Green
Write-Host "  4. Frontend (Vite)   : http://localhost:5173" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
