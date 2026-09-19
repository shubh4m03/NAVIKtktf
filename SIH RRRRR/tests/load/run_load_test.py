#!/usr/bin/env python3
"""
TASK 17 — Load Test Runner (§34).
Executes concurrent requests at 20-50 RPS against endpoints, computes
throughput, p50, p95, p99 latencies, and error rates.
"""

import time
import statistics
import concurrent.futures
import json
import urllib.request
import urllib.error
import sys

def benchmark_endpoint(url, payload, headers, total_requests=150, target_rps=35, concurrency=10):
    print(f"\n===============================================================================")
    print(f"               LOAD TEST EXECUTION: {target_rps} TARGET RPS, {concurrency} WORKERS")
    print(f"===============================================================================")
    print(f"Target URL:       {url}")
    print(f"Total Requests:   {total_requests}")
    print(f"Target Pace:      ~{target_rps} req/s\n")

    latencies_ms = []
    status_codes = []
    error_messages = []

    req_bytes = json.dumps(payload).encode('utf-8')
    interval = 1.0 / target_rps

    start_time = time.perf_counter()

    def do_request(req_id):
        client_ip = f"10.0.{req_id // 256}.{req_id % 256}"
        req_headers = dict(headers)
        req_headers["X-Forwarded-For"] = client_ip
        req = urllib.request.Request(url, data=req_bytes, headers=req_headers, method="POST")
        t0 = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                return resp.status, elapsed_ms, None
        except urllib.error.HTTPError as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            return e.code, elapsed_ms, str(e)
        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            return 599, elapsed_ms, str(e)

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = []
        for i in range(total_requests):
            futures.append(executor.submit(do_request, i))
            time.sleep(interval)

        for f in concurrent.futures.as_completed(futures):
            code, lat, err = f.result()
            status_codes.append(code)
            latencies_ms.append(lat)
            if err:
                error_messages.append(err)

    total_time = time.perf_counter() - start_time
    actual_rps = len(latencies_ms) / total_time
    success_count = sum(1 for c in status_codes if 200 <= c < 300)
    failed_count = len(status_codes) - success_count

    latencies_ms.sort()
    p50 = latencies_ms[int(len(latencies_ms) * 0.50)]
    p90 = latencies_ms[int(len(latencies_ms) * 0.90)]
    p95 = latencies_ms[int(len(latencies_ms) * 0.95)]
    p99 = latencies_ms[int(len(latencies_ms) * 0.99)]

    print("-------------------------------------------------------------------------------")
    print("RESULTS:")
    print(f"Total Completed:  {len(latencies_ms)} requests in {total_time:.2f}s")
    print(f"Actual Rate:      {actual_rps:.2f} req/s")
    print(f"Success (2xx):    {success_count} ({success_count / len(latencies_ms) * 100:.1f}%)")
    print(f"Failures:         {failed_count} ({failed_count / len(latencies_ms) * 100:.1f}%)")
    print(f"Min Latency:      {min(latencies_ms):.2f} ms")
    print(f"p50 Latency:      {p50:.2f} ms")
    print(f"p90 Latency:      {p90:.2f} ms")
    print(f"p95 Latency:      {p95:.2f} ms")
    print(f"p99 Latency:      {p99:.2f} ms")
    print(f"Max Latency:      {max(latencies_ms):.2f} ms")
    print("===============================================================================\n")

    return {
        "total": len(latencies_ms),
        "rps": actual_rps,
        "success_rate": success_count / len(latencies_ms),
        "p50": p50,
        "p95": p95,
        "p99": p99
    }


if __name__ == "__main__":
    print("Load Test Runner configured for 20-50 RPS against Cargo Request endpoints.")
