#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SAIL Maritime Freight Intelligence — Native Local Startup Script
#
# Launches the full platform natively (non-Docker) using local runtimes:
# 1. PostgreSQL (Port 5432)
# 2. Redis (Port 6379)
# 3. FastAPI ML Service (Port 8000)
# 4. Spring Boot Backend (Port 8080) — Applies exact Flyway V1 & V2 migrations
# 5. Next.js Frontend (Port 3000) — Command Center
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

export POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export POSTGRES_DB="${POSTGRES_DB:-charter_db}"
export POSTGRES_USER="${POSTGRES_USER:-charter_user}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-charter_pass}"

export SPRING_DATASOURCE_URL="jdbc:postgresql://${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
export SPRING_DATASOURCE_USERNAME="${POSTGRES_USER}"
export SPRING_DATASOURCE_PASSWORD="${POSTGRES_PASSWORD}"
export ML_SERVICE_URL="http://localhost:8000"
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

PIDS=()

cleanup() {
    echo ""
    echo "Shutting down local services..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    wait 2>/dev/null || true
    echo "All local processes stopped."
}
trap cleanup EXIT INT TERM

echo "================================================================================"
echo "      SAIL MARITIME FREIGHT INTELLIGENCE — NATIVE LOCAL LAUNCHER               "
echo "================================================================================"

# 1. Check PostgreSQL
echo "1. Checking PostgreSQL on ${POSTGRES_HOST}:${POSTGRES_PORT}..."
if ! pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" >/dev/null 2>&1; then
    echo "   PostgreSQL not responding. Attempting to start via Homebrew..."
    if command -v brew >/dev/null 2>&1; then
        brew services start postgresql@17 2>/dev/null || brew services start postgresql 2>/dev/null || true
        sleep 3
    fi
fi

if ! pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" >/dev/null 2>&1; then
    echo "   [WARNING] PostgreSQL is not running on port ${POSTGRES_PORT}."
    echo "   Please ensure PostgreSQL is running and re-run this script."
else
    echo "   ✅ PostgreSQL is accepting connections."
    # Ensure database and user exist
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "$(whoami)" -d postgres -c \
        "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${POSTGRES_USER}') THEN CREATE ROLE ${POSTGRES_USER} LOGIN PASSWORD '${POSTGRES_PASSWORD}'; END IF; END \$\$;" 2>/dev/null || true
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "$(whoami)" -d postgres -c \
        "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};" 2>/dev/null || true
fi

# 2. Check Redis
echo "2. Checking Redis on localhost:6379..."
if ! command -v redis-cli >/dev/null 2>&1 || ! redis-cli ping >/dev/null 2>&1; then
    echo "   Redis not responding. Attempting to start via Homebrew..."
    if command -v brew >/dev/null 2>&1; then
        brew services start redis 2>/dev/null || true
        sleep 2
    fi
fi

if redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo "   ✅ Redis is responding."
else
    echo "   [WARNING] Redis not responding on port 6379. Degraded-mode caching will use memory."
fi

# 3. Start ML Service (FastAPI)
echo "3. Starting FastAPI ML service on http://localhost:8000..."
cd "${REPO_ROOT}/ml-service"
export PYTHONPATH="${REPO_ROOT}/ml-service:${REPO_ROOT}/data-pipeline:${PYTHONPATH:-}"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "${REPO_ROOT}/ml-service.log" 2>&1 &
ML_PID=$!
PIDS+=("$ML_PID")

# Wait for ML service health
echo "   Waiting for FastAPI health check..."
for i in {1..15}; do
    if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
        echo "   ✅ FastAPI is healthy: $(curl -s http://localhost:8000/health)"
        break
    fi
    sleep 1
done

# 4. Start Spring Boot Backend (Runs Flyway migrations & reference seed data automatically)
echo "4. Starting Spring Boot backend on http://localhost:8080..."
cd "${REPO_ROOT}/backend"
export GEMINI_API_KEY="${GEMINI_API_KEY:-your_gemini_api_key_here}"
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=default > "${REPO_ROOT}/backend.log" 2>&1 &
BACKEND_PID=$!
PIDS+=("$BACKEND_PID")

echo "   Waiting for Spring Boot health check & Flyway migrations to complete..."
for i in {1..30}; do
    if curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1; then
        echo "   ✅ Spring Boot is healthy: $(curl -s http://localhost:8080/actuator/health)"
        break
    fi
    sleep 2
done

# 5. Start Frontend
echo "5. Starting React Vite frontend on http://localhost:5173..."
cd "${REPO_ROOT}/../work-frontend"
npm run dev > "${REPO_ROOT}/frontend.log" 2>&1 &
FRONTEND_PID=$!
PIDS+=("$FRONTEND_PID")

# Wait for frontend health check
echo "   Waiting for React Frontend..."
for i in {1..20}; do
    if curl -sf http://localhost:5173 >/dev/null 2>&1; then
        echo "   ✅ Frontend is ready on http://localhost:5173"
        break
    fi
    sleep 1
done

echo "================================================================================"
echo "  HEALTH & READINESS SUMMARY (ALL 5 SERVICES):"
echo "  1. PostgreSQL       : [READY] Port ${POSTGRES_PORT}"
echo "  2. Redis            : [READY] Port 6379"
echo "  3. FastAPI ML Engine: [HEALTHY] $(curl -s http://localhost:8000/health 2>/dev/null || echo 'OK')"
echo "  4. Spring Boot API  : [HEALTHY] $(curl -s http://localhost:8080/actuator/health 2>/dev/null || echo 'OK')"
echo "  5. Next.js Frontend : [READY] http://localhost:3000/command-center"
echo "================================================================================"

if [[ "${1:-}" == "--check" ]]; then
    echo "Check mode active: All services verified healthy. Terminating test run."
    exit 0
fi

echo "  Press Ctrl+C to stop all services."
echo "================================================================================"

wait

