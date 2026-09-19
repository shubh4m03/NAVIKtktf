/**
 * TASK 17 — Load Test with k6 (§34).
 * Evaluates latency, throughput, and error rate for POST /api/v1/cargo-requests at 20-50 RPS.
 *
 * Usage:
 *   k6 run tests/load/k6_load_test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp up to 20 VUs
    { duration: '30s', target: 40 }, // Sustained load at ~35-50 RPS
    { duration: '10s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    http_req_duration: ['p(95)<300'], // 95% of requests must complete below 300ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const MANAGER_TOKEN = __ENV.MANAGER_TOKEN || 'demo_manager_jwt_token';

export default function () {
  const url = `${BASE_URL}/api/v1/cargo-requests`;
  const payload = JSON.stringify({
    userId: 1,
    tonnage: 75000.0,
    originRegion: 'AUSTRALIA_GLADSTONE',
    destinationPortId: 1,
    deadline: '2026-10-15',
    contractPreference: 'spot'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MANAGER_TOKEN}`,
      'X-Forwarded-For': `10.1.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has recommendation or degraded': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.recommendation !== undefined || body.degraded === true;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.5 + Math.random() * 0.5);
}
