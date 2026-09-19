package com.sail.charter.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sail.charter.api.dto.OpportunityLaneDto;
import com.sail.charter.client.cache.ForecastCacheService;
import com.sail.charter.client.mlservice.MlServiceClient;
import com.sail.charter.client.mlservice.MlServiceUnavailableException;
import com.sail.charter.client.mlservice.dto.*;
import com.sail.charter.domain.entity.IdleEstimate;
import com.sail.charter.domain.repository.CargoRequestRepository;
import com.sail.charter.domain.repository.IdleEstimateRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Acceptance Tests for TASK 18 — Idle-Time & Repositioning Engine (§10).
 * Verifies:
 * 1. Single-voyage post-discharge availability window calculation reusing Task 9 turnaround distribution.
 * 2. 2-3 illustrative opportunity lanes generated with explicit provenance tags on every metric.
 * 3. Section 10 mandatory disclaimer is strictly present on output.
 * 4. idle_estimates table row is persisted cleanly in PostgreSQL.
 * 5. GET /api/v1/cargo-requests/{id}/idle-estimate endpoint functions with RBAC enforcement.
 * 6. Degraded-mode fallback functions gracefully when ML service is unreachable.
 */
@SpringBootTest
@AutoConfigureMockMvc
class IdleRepositioningIntegrationTest {

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
    private IdleEstimateRepository idleEstimateRepository;

    private String managerToken;
    private String viewerToken;

    @BeforeEach
    void setUp() {
        forecastCacheService.clearCache();
        managerToken = "Bearer " + jwtTokenProvider.generateAccessToken("manager_user", "MANAGER");
        viewerToken = "Bearer " + jwtTokenProvider.generateAccessToken("viewer_user", "VIEWER");
    }

    private void setupMockMlService() {
        VesselRankResponseDto rankResponse = new VesselRankResponseDto(List.of(
                new VesselRankResponseDto.VesselRankItemDto(
                        1L, "Panamax", 82.5, 1, true, null, 1250000.0, 3.0
                ),
                new VesselRankResponseDto.VesselRankItemDto(
                        2L, "Supramax", 74.0, 2, true, null, 1350000.0, 2.5
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

        RiskScoreResponseDto riskResponse = new RiskScoreResponseDto(
                null,
                42.5,
                "MEDIUM",
                Map.of("w_vol", 0.25, "w_cong", 0.25),
                List.of(d1),
                List.of(d1),
                "Secure 45% now, retain 55% flexible to balance fixed commitment against market volatility.",
                45.0
        );

        when(mlServiceClient.rankVessels(any())).thenReturn(rankResponse);
        when(mlServiceClient.getForecast(any())).thenReturn(forecastResponse);
        when(mlServiceClient.optimizeEntryTiming(any())).thenReturn(timingResponse);
        when(mlServiceClient.scoreRisk(any())).thenReturn(riskResponse);

        IdleRepositioningResponseDto idleMock = new IdleRepositioningResponseDto(
                1L,
                "Paradip",
                3L,
                "Panamax",
                75000.0,
                LocalDate.now().plusDays(14).toString(),
                4.8,
                1.25,
                3.5,
                LocalDate.now().plusDays(19).toString(),
                List.of(
                        new OpportunityLaneDto(
                                "IN-EAST-TO-AUS-EAST",
                                "AUSTRALIA_EAST_COAST",
                                "Gladstone / Newcastle",
                                "Coking Coal Backhaul",
                                4500.0,
                                15.0,
                                247500.0,
                                88.0,
                                "HIGH_CONTINUOUS",
                                "Continuous coking coal corridor",
                                Map.of("distance", "PUBLIC_PROXY", "transit_days", "MODEL_OUTPUT", "cost", "MODEL_OUTPUT", "demand", "PUBLIC_PROXY", "source", "BIMCO")
                        ),
                        new OpportunityLaneDto(
                                "IN-EAST-TO-IDN-KAL",
                                "INDONESIA_SOUTH_KALIMANTAN",
                                "Taboneo / Samarinda",
                                "Thermal Coal Backhaul",
                                2100.0,
                                7.0,
                                108500.0,
                                76.0,
                                "MODERATE_HIGH",
                                "Short-sea thermal coal",
                                Map.of("distance", "PUBLIC_PROXY", "transit_days", "MODEL_OUTPUT", "cost", "MODEL_OUTPUT", "demand", "PUBLIC_PROXY", "source", "UNCTAD")
                        )
                ),
                "ILLUSTRATIVE MVP ONLY: Single-voyage heuristic based on public seasonal trade flows. Fleet-level deadheading optimization requires proprietary vessel schedule data.",
                Map.of("turnaround", "REAL_VERIFIED", "queue", "SIMULATED", "opportunity_lanes", "PUBLIC_PROXY", "disclaimer", "ASSUMPTION")
        );
        when(mlServiceClient.estimateIdleRepositioning(any())).thenReturn(idleMock);
    }

    @Test
    @DisplayName("TASK 18: Decision pipeline calculates and persists IdleEstimate with provenance and Section 10 disclaimer")
    void testCreateCargoRequest_GeneratesAndPersistsIdleEstimate() throws Exception {
        setupMockMlService();

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
                .andExpect(jsonPath("$.idleEstimate").exists())
                .andExpect(jsonPath("$.idleEstimate.dischargePortName").value("Paradip"))
                .andExpect(jsonPath("$.idleEstimate.turnaroundDays").isNumber())
                .andExpect(jsonPath("$.idleEstimate.availableDate").isString())
                .andExpect(jsonPath("$.idleEstimate.opportunityLanes", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.idleEstimate.opportunityLanes[0].lane_id").exists())
                .andExpect(jsonPath("$.idleEstimate.opportunityLanes[0].ballast_distance_nm").isNumber())
                .andExpect(jsonPath("$.idleEstimate.opportunityLanes[0].provenance.distance").value("PUBLIC_PROXY"))
                .andExpect(jsonPath("$.idleEstimate.disclaimer").value(containsString("ILLUSTRATIVE MVP ONLY")))
                .andExpect(jsonPath("$.idleEstimate.disclaimer").value(containsString("Fleet-level deadheading optimization requires proprietary vessel schedule data")))
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> respMap = objectMapper.readValue(responseBody, Map.class);
        Long cargoRequestId = ((Number) respMap.get("id")).longValue();

        // Verify persistence in idle_estimates table (§10, Flyway V3 migration)
        List<IdleEstimate> savedList = idleEstimateRepository.findByCargoRequestId(cargoRequestId);
        assertFalse(savedList.isEmpty(), "idle_estimates table must have at least 1 persisted record");
        IdleEstimate saved = savedList.get(0);
        assertEquals(1L, saved.getDischargePort().getId());
        assertNotNull(saved.getTurnaroundDays());
        assertNotNull(saved.getAvailableDate());
        assertNotNull(saved.getOpportunityLanesJson());
        assertTrue(saved.getOpportunityLanesJson().contains("AUSTRALIA_EAST_COAST"));
        assertTrue(saved.getDisclaimer().contains("ILLUSTRATIVE MVP ONLY"));

        System.out.println("\n[TASK 18 INTEGRATION TEST PASSED]");
        System.out.println("  Cargo Request ID    : " + cargoRequestId);
        System.out.println("  Discharge Port      : Paradip (ID: 1)");
        System.out.println("  Est Turnaround Days : " + saved.getTurnaroundDays());
        System.out.println("  Available Date      : " + saved.getAvailableDate());
        System.out.println("  Section 10 Disclaimer: " + saved.getDisclaimer());
        System.out.println("  idle_estimates DB   : Persisted successfully");
    }

    @Test
    @DisplayName("TASK 18: GET /api/v1/cargo-requests/{id}/idle-estimate returns estimate and enforces RBAC")
    void testGetIdleEstimateEndpoint_AndRbacEnforcement() throws Exception {
        setupMockMlService();

        // 1. Create a cargo request first
        Map<String, Object> payload = new HashMap<>();
        payload.put("tonnage", 75000.0);
        payload.put("originRegion", "AUSTRALIA_NEWCASTLE");
        payload.put("destinationPortId", 1L);
        payload.put("deadline", LocalDate.now().plusDays(40).toString());
        payload.put("contractPreference", "spot");

        String responseBody = mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long cargoRequestId = ((Number) objectMapper.readValue(responseBody, Map.class).get("id")).longValue();

        // 2. GET /api/v1/cargo-requests/{id}/idle-estimate with MANAGER token -> 200 OK
        mockMvc.perform(get("/api/v1/cargo-requests/" + cargoRequestId + "/idle-estimate")
                        .header("Authorization", managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cargoRequestId").value(cargoRequestId))
                .andExpect(jsonPath("$.dischargePortName").value("Paradip"))
                .andExpect(jsonPath("$.opportunityLanes", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.disclaimer").value(containsString("ILLUSTRATIVE MVP ONLY")));

        // 3. GET /api/v1/cargo-requests/{id}/idle-estimate with VIEWER token -> 403 Forbidden
        mockMvc.perform(get("/api/v1/cargo-requests/" + cargoRequestId + "/idle-estimate")
                        .header("Authorization", viewerToken))
                .andExpect(status().isForbidden());

        // 4. GET /api/v1/cargo-requests/{id}/idle-estimate unauthenticated -> 401 Unauthorized
        mockMvc.perform(get("/api/v1/cargo-requests/" + cargoRequestId + "/idle-estimate"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TASK 18: Degraded fallback generates valid idle estimate when ML service is down")
    void testIdleEstimate_DegradedFallbackWhenMlDown() throws Exception {
        // Simulate ML service outage
        when(mlServiceClient.rankVessels(any()))
                .thenThrow(new MlServiceUnavailableException("Connection refused (FastAPI down)"));

        Map<String, Object> payload = new HashMap<>();
        payload.put("tonnage", 65000.0);
        payload.put("originRegion", "AUSTRALIA_NEWCASTLE");
        payload.put("destinationPortId", 1L);
        payload.put("deadline", LocalDate.now().plusDays(30).toString());
        payload.put("contractPreference", "spot");

        mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.degraded").value(true))
                .andExpect(jsonPath("$.idleEstimate").exists())
                .andExpect(jsonPath("$.idleEstimate.opportunityLanes", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.idleEstimate.disclaimer").value(containsString("ILLUSTRATIVE MVP ONLY")));

        System.out.println("[TASK 18 DEGRADED FALLBACK TEST PASSED]");
    }
}
