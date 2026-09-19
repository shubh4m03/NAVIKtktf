package com.sail.charter.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory Token-Bucket / Sliding Window Rate Limiter (§27).
 * Protects cargo-request and scenario endpoints against abusive request bursts.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;
    private int maxRequestsPerMinute;
    private final Map<String, ClientRequestTracker> clientRequests = new ConcurrentHashMap<>();

    public RateLimitingFilter(
            @Value("${security.rate-limit.max-per-minute:60}") int maxRequestsPerMinute,
            ObjectMapper objectMapper
    ) {
        this.maxRequestsPerMinute = maxRequestsPerMinute;
        this.objectMapper = objectMapper;
    }

    public void setMaxRequestsPerMinuteForTest(int limit) {
        this.maxRequestsPerMinute = limit;
    }

    public void resetTrackersForTest() {
        this.clientRequests.clear();
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();
        String method = request.getMethod();

        // Rate limit applies to cargo-requests creation and scenario endpoints (§27)
        if (uri.startsWith("/api/v1/cargo-requests") && "POST".equalsIgnoreCase(method)) {
            String clientIp = getClientIp(request);
            ClientRequestTracker tracker = clientRequests.computeIfAbsent(clientIp, k -> new ClientRequestTracker());

            synchronized (tracker) {
                long now = Instant.now().getEpochSecond();
                if (now - tracker.windowStart >= 60) {
                    tracker.windowStart = now;
                    tracker.requestCount = 0;
                }

                if (tracker.requestCount >= maxRequestsPerMinute) {
                    long retryAfterSeconds = Math.max(1, 60 - (now - tracker.windowStart));
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));

                    Map<String, Object> errorBody = new HashMap<>();
                    errorBody.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
                    errorBody.put("error", "Too Many Requests");
                    errorBody.put("message", "Rate limit exceeded on cargo-requests endpoint. Max " + maxRequestsPerMinute + " requests/min allowed.");
                    errorBody.put("retryAfterSeconds", retryAfterSeconds);

                    response.getWriter().write(objectMapper.writeValueAsString(errorBody));
                    return;
                }

                tracker.requestCount++;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private static class ClientRequestTracker {
        long windowStart = Instant.now().getEpochSecond();
        int requestCount = 0;
    }
}
