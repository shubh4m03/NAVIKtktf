package com.sail.charter.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sail.charter.client.cache.ForecastCacheService;
import com.sail.charter.client.mlservice.MlServiceClient;
import com.sail.charter.client.mlservice.MlServiceUnavailableException;
import com.sail.charter.client.mlservice.dto.*;
import com.sail.charter.domain.entity.*;
import com.sail.charter.domain.repository.*;
import com.sail.charter.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrchestrationPipelineIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private MlServiceClient mlServiceClient;

    @Autowired
    private ForecastCacheService forecastCacheService;

    @Autowired
    private CargoRequestRepository cargoRequestRepository;

    @Autowired
    private ForecastRunRepository forecastRunRepository;

    @Autowired
    private ForecastResultRepository forecastResultRepository;

    @Autowired
    private VesselRankingRepository vesselRankingRepository;

    @Autowired
    private RiskEventRepository riskEventRepository;

    @Autowired
    private RecommendationRepository recommendationRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private PortRepository portRepository;

    @Autowired
    private VesselClassRepository vesselClassRepository;

    private String managerToken;

    @BeforeEach
    void setUp() {
        forecastCacheService.clearCache();
        managerToken = "Bearer " + jwtTokenProvider.generateAccessToken("manager_user", "MANAGER");
    }

    @Test
    @DisplayName("TASK 11 HAPPY PATH: End-to-end orchestration calls FastAPI, persists 5 DB tables, returns 200 with full decision chain")
    void testOrchestrationPipeline_HappyPath() throws Exception {
        // 1. Setup Mock responses from FastAPI microservice
        VesselRankResponseDto rankResponse = new VesselRankResponseDto(List.of(
                new VesselRankResponseDto.VesselRankItemDto(
                        1L, "Panamax", 82.5, 1, true, null, 1250000.0, 3.0
                ),
                new VesselRankResponseDto.VesselRankItemDto(
                        2L, "Supramax", 74.0, 2, true, null, 1350000.0, 2.5
                ),
                new VesselRankResponseDto.VesselRankItemDto(
                        3L, "Capesize", 0.0, 999, false, "Vessel draft 18.0m exceeds port max draft 14.5m", 1100000.0, 5.0
                )
        ));

        ForecastResponseDto forecastResponse = new ForecastResponseDto(
                27.50,
                List.of(26.8, 28.2),
                List.of(24.9, 31.7),
                0.31,
                78.0,
                "sarimax_cqr_hybrid_v1",
                Map.of("freight_index", "PUBLIC_PROXY", "bunker", "PUBLIC_PROXY", "fx", "REAL_VERIFIED"),
                OffsetDateTime.now().toString()
        );

        EntryTimingResponseDto timingResponse = new EntryTimingResponseDto(
                "SPLIT",
                45.0,
                0.45,
                1484860.0,
                1394860.0,
                1412500.0,
                true,
                22.5,
                Map.of("action", "SPLIT", "split_pct", 45, "narrative", "Securing 45% now balances expected cost against market risk.")
        );

        RiskScoreResponseDto.RiskDriverDto d1 = new RiskScoreResponseDto.RiskDriverDto(
                "forecast_volatility", "Forecast Uncertainty & Volatility", 0.35, 0.25, 8.75, "UP", "MODEL_OUTPUT", "Quantile LightGBM", "High volatility"
        );
        RiskScoreResponseDto.RiskDriverDto d2 = new RiskScoreResponseDto.RiskDriverDto(
                "port_congestion", "Port Congestion & Turnaround Delay", 0.40, 0.25, 10.0, "UP", "SIMULATED", "Port Congestion Simulation", "Congestion delay"
        );

        RiskScoreResponseDto riskResponse = new RiskScoreResponseDto(
                null,
                42.5,
                "MEDIUM",
                Map.of("w_vol", 0.25, "w_cong", 0.25, "w_wx", 0.20, "w_avail", 0.15, "w_shock", 0.15),
                List.of(d1, d2),
                List.of(d1, d2),
                "Secure 45% now, retain 55% flexible to balance fixed commitment against market volatility.",
                45.0
        );

        when(mlServiceClient.rankVessels(any())).thenReturn(rankResponse);
        when(mlServiceClient.getForecast(any())).thenReturn(forecastResponse);
        when(mlServiceClient.optimizeEntryTiming(any())).thenReturn(timingResponse);
        when(mlServiceClient.scoreRisk(any())).thenReturn(riskResponse);

        // 2. Execute POST /api/v1/cargo-requests
        Map<String, Object> payload = new HashMap<>();
        payload.put("tonnage", 75000.0);
        payload.put("originRegion", "AUSTRALIA_NEWCASTLE");
        payload.put("destinationPortId", 1L); // Paradip
        payload.put("deadline", LocalDate.now().plusDays(40).toString());
        payload.put("contractPreference", "spot");

        String responseBody = mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.degraded").value(false))
                .andExpect(jsonPath("$.status").value("PROCESSED"))
                .andExpect(jsonPath("$.forecast.expectedValueUsdPerTon").value(27.50))
                .andExpect(jsonPath("$.forecast.modelUsed").value("sarimax_cqr_hybrid_v1"))
                .andExpect(jsonPath("$.vesselRankings", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.vesselRankings[0].vesselClassName").value("Panamax"))
                .andExpect(jsonPath("$.vesselRankings[0].feasible").value(true))
                .andExpect(jsonPath("$.risk.riskScore").value(42.5))
                .andExpect(jsonPath("$.risk.category").value("MEDIUM"))
                .andExpect(jsonPath("$.recommendation.action").value("SPLIT"))
                .andExpect(jsonPath("$.recommendation.splitPct").value(45.0))
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> respMap = objectMapper.readValue(responseBody, Map.class);
        Long cargoRequestId = ((Number) respMap.get("id")).longValue();

        // 3. Verify database persistence in all 5 PostgreSQL tables (§17)
        List<ForecastRun> runs = forecastRunRepository.findByCargoRequestId(cargoRequestId);
        assertEquals(1, runs.size(), "forecast_runs row must be persisted");
        ForecastRun run = runs.get(0);
        assertEquals("sarimax_cqr_hybrid_v1", run.getModelUsed());

        List<ForecastResult> results = forecastResultRepository.findByForecastRunId(run.getId());
        assertEquals(1, results.size(), "forecast_results row must be persisted");
        assertEquals(27.50, results.get(0).getExpectedValue());

        List<VesselRanking> rankings = vesselRankingRepository.findByForecastRunId(run.getId());
        assertFalse(rankings.isEmpty(), "vessel_rankings rows must be persisted");

        List<RiskEvent> risks = riskEventRepository.findByCargoRequestId(cargoRequestId);
        assertEquals(1, risks.size(), "risk_events row must be persisted");
        assertEquals(42.5, risks.get(0).getRiskScore());

        List<Recommendation> recs = recommendationRepository.findByCargoRequestId(cargoRequestId);
        assertEquals(1, recs.size(), "recommendations row must be persisted");
        assertEquals("SPLIT", recs.get(0).getAction());
        assertEquals(45.0, recs.get(0).getSplitPct());

        System.out.println("\n[HAPPY PATH ORCHESTRATION PIPELINE TEST PASSED]");
        System.out.println("  Cargo Request ID  : " + cargoRequestId);
        System.out.println("  Status            : PROCESSED");
        System.out.println("  Degraded          : false");
        System.out.println("  Forecast Rate     : $" + results.get(0).getExpectedValue() + "/MT");
        System.out.println("  Recommendation    : SPLIT (45.0% now)");
        System.out.println("  Risk Score        : " + risks.get(0).getRiskScore() + " (" + risks.get(0).getCategory() + ")");
        System.out.println("  PostgreSQL Tables : 5/5 persisted cleanly");
    }

    @Test
    @DisplayName("TASK 11 SIMULATED OUTAGE: When FastAPI is unreachable, return 200 with degraded:true and cached forecast from Redis")
    void testOrchestrationPipeline_SimulatedOutage_DegradedFallback() throws Exception {
        // 1. Seed Redis cache with an existing valid forecast
        Route testRoute = routeRepository.findAll().stream().findFirst().orElseGet(() ->
                routeRepository.save(new Route(null, "AUSTRALIA_NEWCASTLE", portRepository.findAll().get(0), 4500.0, 15.0))
        );
        VesselClass testVessel = vesselClassRepository.findAll().stream().findFirst().orElseGet(() ->
                vesselClassRepository.save(new VesselClass(null, "Panamax", 65000.0, 100000.0, 14.0, 228.0, 32.3))
        );

        ForecastResponseDto cachedForecast = new ForecastResponseDto(
                28.75,
                List.of(27.5, 29.8),
                List.of(25.0, 32.5),
                0.35,
                75.0,
                "cached_lightgbm_v2",
                Map.of("freight_index", "PUBLIC_PROXY", "status", "CACHED_IN_REDIS"),
                OffsetDateTime.now().minusHours(2).toString()
        );

        forecastCacheService.cacheForecast(testRoute.getId(), testVessel.getId(), cachedForecast);

        // 2. Simulate FastAPI complete outage: throw MlServiceUnavailableException
        when(mlServiceClient.rankVessels(any()))
                .thenThrow(new MlServiceUnavailableException("Connection refused: http://localhost:8000 (FastAPI down)"));

        // 3. Execute POST /api/v1/cargo-requests during simulated outage
        Map<String, Object> payload = new HashMap<>();
        payload.put("tonnage", 65000.0);
        payload.put("originRegion", testRoute.getOriginRegion());
        payload.put("destinationPortId", testRoute.getDestinationPort().getId());
        payload.put("deadline", LocalDate.now().plusDays(25).toString());
        payload.put("contractPreference", "spot");

        // CRITICAL ACCEPTANCE CHECK: Must return 200 OK (NOT 500), with degraded: true and cached forecast
        mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.degraded").value(true))
                .andExpect(jsonPath("$.status").value("DEGRADED"))
                .andExpect(jsonPath("$.forecast.expectedValueUsdPerTon").value(28.75))
                .andExpect(jsonPath("$.forecast.dataProvenance.status").value("DEGRADED"))
                .andExpect(jsonPath("$.forecast.dataProvenance.note").value(containsString("Redis cache")))
                .andExpect(jsonPath("$.recommendation.action").exists())
                .andExpect(jsonPath("$.risk.riskScore").isNumber());

        System.out.println("\n[SIMULATED OUTAGE DEGRADED FALLBACK TEST PASSED]");
        System.out.println("  HTTP Status Code   : 200 OK (Graceful degradation, NO 500 error!)");
        System.out.println("  Degraded Flag      : true");
        System.out.println("  Served From        : Redis Cache (expected_rate=$28.75/MT)");
        System.out.println("  Provenance Tag     : DEGRADED");
    }
}
