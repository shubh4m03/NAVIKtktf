package com.sail.charter.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sail.charter.api.dto.CreateCargoRequestDto;
import com.sail.charter.api.dto.ScenarioPerturbationDto;
import com.sail.charter.client.cache.ForecastCacheService;
import com.sail.charter.client.mlservice.MlServiceClient;
import com.sail.charter.client.mlservice.MlServiceUnavailableException;
import com.sail.charter.client.mlservice.dto.*;
import com.sail.charter.domain.entity.Scenario;
import com.sail.charter.domain.repository.CargoRequestRepository;
import com.sail.charter.domain.repository.ScenarioRepository;
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
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ScenarioSimulatorIntegrationTest {

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
    private ScenarioRepository scenarioRepository;

    private String managerToken;

    @BeforeEach
    void setUp() {
        forecastCacheService.clearCache();
        managerToken = "Bearer " + jwtTokenProvider.generateAccessToken("manager_user", "MANAGER");
    }

    @Test
    @DisplayName("TASK 12: Freight-shock-up scenario shifts recommendation toward CHARTER_NOW & higher split % vs unperturbed baseline, stores in scenarios without new cargo_request")
    void testScenarioSimulator_FreightShockUp_ShiftsToCharterNow() throws Exception {
        // 1. Mock FastAPI downstream microservice behavior
        VesselRankResponseDto rankResponse = new VesselRankResponseDto(List.of(
                new VesselRankResponseDto.VesselRankItemDto(1L, "Panamax", 82.5, 1, true, null, 1250000.0, 3.0),
                new VesselRankResponseDto.VesselRankItemDto(2L, "Supramax", 74.0, 2, true, null, 1350000.0, 2.5),
                new VesselRankResponseDto.VesselRankItemDto(3L, "Capesize", 0.0, 999, false, "Draft exceeds port limit", 1100000.0, 5.0)
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

        when(mlServiceClient.rankVessels(any())).thenReturn(rankResponse);
        when(mlServiceClient.getForecast(any())).thenReturn(forecastResponse);

        // Dynamic timing mock: when forecastExpectedRate > currentSpotRate (freight shock), return CHARTER_NOW (100% split)
        when(mlServiceClient.optimizeEntryTiming(any())).thenAnswer(invocation -> {
            EntryTimingRequestDto req = invocation.getArgument(0);
            if (req.getForecastExpectedRate() != null && req.getCurrentSpotRate() != null
                    && req.getForecastExpectedRate() > req.getCurrentSpotRate()) {
                return new EntryTimingResponseDto(
                        "CHARTER_NOW",
                        100.0,
                        1.0,
                        1484860.0,
                        2384860.0,
                        1484860.0,
                        true,
                        22.5,
                        Map.of("action", "CHARTER_NOW", "split_pct", 100, "narrative", "Forecast freight shock forces immediate 100% charter commitment.")
                );
            } else {
                return new EntryTimingResponseDto(
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
            }
        });

        when(mlServiceClient.scoreRisk(any())).thenReturn(new RiskScoreResponseDto(
                null,
                42.5,
                "MEDIUM",
                Map.of("w_vol", 0.25, "w_cong", 0.25, "w_wx", 0.20, "w_avail", 0.15, "w_shock", 0.15),
                List.of(new RiskScoreResponseDto.RiskDriverDto("forecast_volatility", "Forecast Uncertainty", 0.35, 0.25, 8.75, "UP", "MODEL_OUTPUT", "LGBM", "Spread")),
                List.of(),
                "Secure allocation now to mitigate freight risk.",
                45.0
        ));

        // 2. Establish UNPERTURBED BASELINE via POST /api/v1/cargo-requests
        CreateCargoRequestDto baseReq = new CreateCargoRequestDto();
        baseReq.setTonnage(75000.0);
        baseReq.setOriginRegion("AUSTRALIA_NEWCASTLE");
        baseReq.setDestinationPortId(1L);
        baseReq.setDeadline(LocalDate.now().plusDays(40));
        baseReq.setContractPreference("spot");

        String baselineResponse = mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(baseReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.recommendation.action").value("SPLIT"))
                .andExpect(jsonPath("$.recommendation.splitPct").value(45.0))
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> baseMap = objectMapper.readValue(baselineResponse, Map.class);
        Long cargoRequestId = ((Number) baseMap.get("id")).longValue();

        long cargoRequestCountBefore = cargoRequestRepository.count();
        long scenariosCountBefore = scenarioRepository.count();

        // 3. Execute PERTURBED SCENARIO via POST /api/v1/cargo-requests/{id}/scenario
        // Apply large freight-shock-up (+50%)
        ScenarioPerturbationDto perturbation = new ScenarioPerturbationDto(50.0, 10.0, null, null);

        String scenarioResponse = mockMvc.perform(post("/api/v1/cargo-requests/" + cargoRequestId + "/scenario")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(perturbation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(cargoRequestId))
                .andExpect(jsonPath("$.isScenario").value(true))
                .andExpect(jsonPath("$.scenarioId").isNumber())
                .andExpect(jsonPath("$.recommendation.action").value("CHARTER_NOW"))
                .andExpect(jsonPath("$.recommendation.splitPct").value(100.0))
                .andExpect(jsonPath("$.inputPerturbation.freight_shock_pct").value(50.0))
                .andReturn().getResponse().getContentAsString();

        Map<String, Object> scenarioMap = objectMapper.readValue(scenarioResponse, Map.class);
        Long scenarioId = ((Number) scenarioMap.get("scenarioId")).longValue();

        // 4. VERIFY ACCEPTANCE CRITERIA
        // A. Recommendation shifted toward CHARTER_NOW / higher split percentage
        Double baselineSplit = ((Number) ((Map<?, ?>) baseMap.get("recommendation")).get("splitPct")).doubleValue();
        Double scenarioSplit = ((Number) ((Map<?, ?>) scenarioMap.get("recommendation")).get("splitPct")).doubleValue();
        String baselineAction = (String) ((Map<?, ?>) baseMap.get("recommendation")).get("action");
        String scenarioAction = (String) ((Map<?, ?>) scenarioMap.get("recommendation")).get("action");

        assertEquals("SPLIT", baselineAction);
        assertEquals(45.0, baselineSplit);
        assertEquals("CHARTER_NOW", scenarioAction);
        assertEquals(100.0, scenarioSplit);
        assertTrue(scenarioSplit > baselineSplit, "Scenario split percentage must be strictly higher than unperturbed baseline");

        // B. NO new cargo_request row was created (count remains identical)
        long cargoRequestCountAfter = cargoRequestRepository.count();
        assertEquals(cargoRequestCountBefore, cargoRequestCountAfter,
                "Scenario simulation must NOT persist a new cargo_request row (§31)");

        // C. Scenario result is stored under the scenarios table (§17, §31)
        long scenariosCountAfter = scenarioRepository.count();
        assertEquals(scenariosCountBefore + 1, scenariosCountAfter,
                "Scenario simulation must store a new row in the scenarios table");

        Scenario savedScenario = scenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new AssertionError("Scenario row not found in database"));

        assertEquals(cargoRequestId, savedScenario.getCargoRequest().getId());
        assertNotNull(savedScenario.getInputPerturbationJson());
        assertTrue(savedScenario.getInputPerturbationJson().contains("freight_shock_pct"));
        assertNotNull(savedScenario.getResultingRecommendationJson());
        assertTrue(savedScenario.getResultingRecommendationJson().contains("CHARTER_NOW"));

        System.out.println("\n================================================================================");
        System.out.println("  TASK 12 — SCENARIO SIMULATOR INTEGRATION TEST PASSED");
        System.out.println("================================================================================");
        System.out.println("  Cargo Request ID       : " + cargoRequestId);
        System.out.println("  Baseline Action        : " + baselineAction + " (Split: " + baselineSplit + "% now)");
        System.out.println("  Perturbation Applied   : +50.0% Freight Shock, +10.0% Congestion Shock");
        System.out.println("  Scenario Action        : " + scenarioAction + " (Split: " + scenarioSplit + "% now)");
        System.out.println("  Recommendation Shift   : SPLIT (45%) -> CHARTER_NOW (100% now) [CONFIRMED]");
        System.out.println("  Cargo Requests Count   : " + cargoRequestCountBefore + " -> " + cargoRequestCountAfter + " (NO NEW ROW PERSISTED)");
        System.out.println("  Scenarios Table Row ID : " + savedScenario.getId() + " (Stored under scenarios table)");
        System.out.println("  Input Perturbation JSON: " + savedScenario.getInputPerturbationJson());
        System.out.println("  Resulting Rec JSON     : " + savedScenario.getResultingRecommendationJson());
        System.out.println("================================================================================\n");
    }

    @Test
    @DisplayName("TASK 12 DEGRADED SCENARIO: When ML service is unreachable, scenario returns 200 with degraded:true and scenarioId")
    void testScenarioSimulator_DegradedFallback() throws Exception {
        // 1. Create baseline cargo request
        CreateCargoRequestDto baseReq = new CreateCargoRequestDto();
        baseReq.setTonnage(65000.0);
        baseReq.setOriginRegion("AUSTRALIA_NEWCASTLE");
        baseReq.setDestinationPortId(1L);
        baseReq.setDeadline(LocalDate.now().plusDays(30));
        baseReq.setContractPreference("spot");

        // Mock normal setup for creation
        when(mlServiceClient.rankVessels(any())).thenReturn(new VesselRankResponseDto(List.of(
                new VesselRankResponseDto.VesselRankItemDto(1L, "Panamax", 80.0, 1, true, null, 1200000.0, 3.0)
        )));
        when(mlServiceClient.getForecast(any())).thenReturn(new ForecastResponseDto(
                28.0, List.of(27.0, 29.0), List.of(25.0, 32.0), 0.30, 80.0, "lgbm", Map.of(), OffsetDateTime.now().toString()
        ));
        when(mlServiceClient.optimizeEntryTiming(any())).thenReturn(new EntryTimingResponseDto(
                "SPLIT", 50.0, 0.5, 1200000.0, 1200000.0, 1200000.0, true, 20.0, Map.of()
        ));
        when(mlServiceClient.scoreRisk(any())).thenReturn(new RiskScoreResponseDto(
                null, 40.0, "MEDIUM", Map.of(), List.of(), List.of(), "mitigate", 50.0
        ));

        String baselineResp = mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(baseReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long cargoRequestId = ((Number) objectMapper.readValue(baselineResp, Map.class).get("id")).longValue();

        // 2. Simulate ML service down during scenario simulation
        when(mlServiceClient.rankVessels(any()))
                .thenThrow(new MlServiceUnavailableException("Connection refused (FastAPI down)"));

        // 3. Post scenario simulation during outage
        ScenarioPerturbationDto perturbation = new ScenarioPerturbationDto(40.0, null, null, null);

        mockMvc.perform(post("/api/v1/cargo-requests/" + cargoRequestId + "/scenario")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(perturbation)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.degraded").value(true))
                .andExpect(jsonPath("$.isScenario").value(true))
                .andExpect(jsonPath("$.scenarioId").isNumber())
                .andExpect(jsonPath("$.recommendation.action").value("CHARTER_NOW"))
                .andExpect(jsonPath("$.recommendation.splitPct").value(100.0));

        System.out.println("\n[TASK 12 DEGRADED SCENARIO TEST PASSED: 200 OK returned with degraded:true and scenario persisted]");
    }
}
