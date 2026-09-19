#!/usr/bin/env bash
set -euo pipefail

echo "=== Charter Intelligence Platform — Smoke Test ==="
echo ""

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
ML_SERVICE_URL="${ML_SERVICE_URL:-http://localhost:8000}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-charter_db}"
POSTGRES_USER="${POSTGRES_USER:-charter_user}"

PASS=0
FAIL=0

# Test 1: Spring Boot health
echo "1. Checking Spring Boot health endpoint..."
if curl -sf "${BACKEND_URL}/actuator/health" > /dev/null 2>&1; then
    RESPONSE=$(curl -s "${BACKEND_URL}/actuator/health")
    echo "   ✅ Spring Boot is healthy: ${RESPONSE}"
    PASS=$((PASS + 1))
else
    echo "   ❌ Spring Boot health check failed"
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 2: FastAPI health
echo "2. Checking FastAPI health endpoint..."
if curl -sf "${ML_SERVICE_URL}/health" > /dev/null 2>&1; then
    RESPONSE=$(curl -s "${ML_SERVICE_URL}/health")
    echo "   ✅ FastAPI is healthy: ${RESPONSE}"
    PASS=$((PASS + 1))
else
    echo "   ❌ FastAPI health check failed"
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 3: Postgres connectivity
echo "3. Checking PostgreSQL connectivity..."
if PGPASSWORD=charter_pass psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL is accepting connections"
    PASS=$((PASS + 1))
else
    echo "   ❌ PostgreSQL connection failed"
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 4: Redis connectivity
echo "4. Checking Redis connectivity..."
if redis-cli -h "${REDIS_HOST:-localhost}" ping 2>/dev/null | grep -q "PONG"; then
    echo "   ✅ Redis is responding"
    PASS=$((PASS + 1))
else
    echo "   ❌ Redis connection failed"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="

if [ ${FAIL} -gt 0 ]; then
    exit 1
fi

echo "All smoke tests passed!"
