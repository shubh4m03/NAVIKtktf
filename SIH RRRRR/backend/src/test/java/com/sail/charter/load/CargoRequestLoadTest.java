package com.sail.charter.load;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sail.charter.api.controller.CargoRequestController;
import com.sail.charter.api.dto.CreateCargoRequestDto;
import com.sail.charter.api.dto.DecisionChainResponseDto;
import com.sail.charter.config.SecurityConfig;
import com.sail.charter.domain.repository.CargoRequestRepository;
import com.sail.charter.domain.repository.UserRepository;
import com.sail.charter.domain.service.AuditLogService;
import com.sail.charter.domain.service.CargoRequestService;
import com.sail.charter.security.JwtAuthenticationFilter;
import com.sail.charter.security.JwtTokenProvider;
import com.sail.charter.security.RateLimitingFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Concurrency & Load Benchmark for POST /api/v1/cargo-requests (§34).
 * Exercises endpoint at 20-50 requests per second across concurrent client threads,
 * computing throughput, p50, p95, p99 latencies, and verifying 0% failure rate.
 */
@WebMvcTest(controllers = CargoRequestController.class)
@Import({
        SecurityConfig.class,
        JwtTokenProvider.class,
        JwtAuthenticationFilter.class,
        RateLimitingFilter.class
})
public class CargoRequestLoadTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @MockBean
    private CargoRequestService cargoRequestService;

    @MockBean
    private AuditLogService auditLogService;

    @MockBean
    private CargoRequestRepository cargoRequestRepository;

    @MockBean
    private UserRepository userRepository;

    private String managerToken;

    @BeforeEach
    void setUp() {
        // Generous limit for high-throughput concurrency load test
        rateLimitingFilter.setMaxRequestsPerMinuteForTest(100_000);
        rateLimitingFilter.resetTrackersForTest();
        managerToken = "Bearer " + jwtTokenProvider.generateAccessToken("manager_user", "MANAGER");

        DecisionChainResponseDto mockResponse = new DecisionChainResponseDto();
        mockResponse.setId(100L);
        mockResponse.setStatus("COMPLETED");
        mockResponse.setDegraded(false);
        mockResponse.setTonnage(75000.0);
        mockResponse.setDestinationPortName("PARADIP");
        mockResponse.setRecommendation(new DecisionChainResponseDto.RecommendationSummaryDto(
                1L, "SPLIT", 50.0, "{\"split_pct\":50,\"action\":\"SPLIT\"}", OffsetDateTime.now()
        ));

        when(cargoRequestService.createAndProcessCargoRequest(any(CreateCargoRequestDto.class)))
                .thenReturn(mockResponse);
    }

    @Test
    @DisplayName("Load Benchmark: Run 150 requests at 30-50 RPS concurrency on POST /api/v1/cargo-requests")
    void testCargoRequestEndpointUnderLoad() throws Exception {
        int totalRequests = 150;
        int threadPoolSize = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);

        CreateCargoRequestDto payload = new CreateCargoRequestDto(
                1L, 75000.0, "AUSTRALIA_GLADSTONE", 1L, LocalDate.now().plusDays(30), "spot"
        );
        String requestJson = objectMapper.writeValueAsString(payload);

        // Warm up
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/v1/cargo-requests")
                    .header("Authorization", managerToken)
                    .header("X-Forwarded-For", "192.168.1." + (i % 200))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestJson));
        }

        List<Long> latenciesMs = Collections.synchronizedList(new ArrayList<>());
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        CountDownLatch latch = new CountDownLatch(totalRequests);
        long startTimeNano = System.nanoTime();

        for (int i = 0; i < totalRequests; i++) {
            final int requestId = i;
            executor.submit(() -> {
                long reqStart = System.nanoTime();
                try {
                    MockHttpServletResponse resp = mockMvc.perform(post("/api/v1/cargo-requests")
                                    .header("Authorization", managerToken)
                                    .header("X-Forwarded-For", "10.0." + (requestId / 256) + "." + (requestId % 256))
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(requestJson))
                            .andReturn().getResponse();

                    long reqDurationMs = (System.nanoTime() - reqStart) / 1_000_000;
                    latenciesMs.add(reqDurationMs);

                    if (resp.getStatus() == 200) {
                        successCount.incrementAndGet();
                    } else {
                        errorCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    errorCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
            // Pacing to achieve ~30-50 RPS target
            Thread.sleep(25);
        }

        boolean completed = latch.await(30, TimeUnit.SECONDS);
        long totalDurationMs = (System.nanoTime() - startTimeNano) / 1_000_000;
        executor.shutdown();

        assertTrue(completed, "Load test completed within timeout");
        assertEquals(0, errorCount.get(), "Zero error rate expected");
        assertEquals(totalRequests, successCount.get(), "All requests succeeded with HTTP 200");

        Collections.sort(latenciesMs);
        double rps = (totalRequests * 1000.0) / totalDurationMs;
        long p50 = latenciesMs.get((int) (latenciesMs.size() * 0.50));
        long p95 = latenciesMs.get((int) (latenciesMs.size() * 0.95));
        long p99 = latenciesMs.get((int) (latenciesMs.size() * 0.99));
        long min = latenciesMs.get(0);
        long max = latenciesMs.get(latenciesMs.size() - 1);

        System.out.println("===============================================================================");
        System.out.println("                      TASK 17 LOAD TEST BENCHMARK REPORT                      ");
        System.out.println("===============================================================================");
        System.out.printf("Target Endpoint:       POST /api/v1/cargo-requests%n");
        System.out.printf("Total Requests:        %d%n", totalRequests);
        System.out.printf("Successful (200 OK):   %d (100.0%%)%n", successCount.get());
        System.out.printf("Failed (Non-200/Err):  %d (0.0%%)%n", errorCount.get());
        System.out.printf("Total Duration:        %d ms (%.2f s)%n", totalDurationMs, totalDurationMs / 1000.0);
        System.out.printf("Throughput:            %.2f req/s (Target: 20-50 RPS)%n", rps);
        System.out.printf("Min Latency:           %d ms%n", min);
        System.out.printf("p50 Latency:           %d ms%n", p50);
        System.out.printf("p95 Latency:           %d ms%n", p95);
        System.out.printf("p99 Latency:           %d ms%n", p99);
        System.out.printf("Max Latency:           %d ms%n", max);
        System.out.println("===============================================================================");

        assertTrue(rps >= 20.0, "Throughput meets target >= 20 RPS");
        assertTrue(p95 < 250, "p95 latency is sub-250ms");
    }
}
