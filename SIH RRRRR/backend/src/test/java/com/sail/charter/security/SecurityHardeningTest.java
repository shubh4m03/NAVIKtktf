package com.sail.charter.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sail.charter.api.controller.AuditController;
import com.sail.charter.api.controller.AuthController;
import com.sail.charter.api.controller.CargoRequestController;
import com.sail.charter.api.controller.ContractController;
import com.sail.charter.api.dto.CreateCargoRequestDto;
import com.sail.charter.api.dto.CreateContractDto;
import com.sail.charter.api.dto.DecisionChainResponseDto;
import com.sail.charter.config.SecurityConfig;
import com.sail.charter.domain.entity.AuditLog;
import com.sail.charter.domain.entity.CargoRequest;
import com.sail.charter.domain.entity.Contract;
import com.sail.charter.domain.entity.ContractType;
import com.sail.charter.domain.repository.CargoRequestRepository;
import com.sail.charter.domain.repository.ContractRepository;
import com.sail.charter.domain.repository.UserRepository;
import com.sail.charter.domain.service.AuditLogService;
import com.sail.charter.domain.service.CargoRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Acceptance Tests for TASK 16 — Security Hardening (§27).
 * Verifies:
 * 1. Unauthenticated requests get 401 Unauthorized.
 * 2. VIEWER token gets 403 Forbidden on POST /api/v1/cargo-requests.
 * 3. MANAGER token succeeds (200 OK) on POST /api/v1/cargo-requests.
 * 4. Audit log row is created for every recommendation returned.
 * 5. MANAGER token succeeds on POST /api/v1/contracts and logs audit entry.
 * 6. Rate limiter returns 429 Too Many Requests when request limit is exceeded.
 * 7. Token tamper/invalid signature is rejected.
 */
@WebMvcTest(controllers = {
        CargoRequestController.class,
        ContractController.class,
        AuditController.class,
        AuthController.class
})
@Import({
        SecurityConfig.class,
        JwtTokenProvider.class,
        JwtAuthenticationFilter.class,
        RateLimitingFilter.class
})
class SecurityHardeningTest {

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
    private ContractRepository contractRepository;

    @MockBean
    private CargoRequestRepository cargoRequestRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    private String viewerToken;
    private String analystToken;
    private String managerToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        rateLimitingFilter.resetTrackersForTest();
        rateLimitingFilter.setMaxRequestsPerMinuteForTest(60);

        viewerToken = "Bearer " + jwtTokenProvider.generateAccessToken("viewer_user", "VIEWER");
        analystToken = "Bearer " + jwtTokenProvider.generateAccessToken("analyst_user", "ANALYST");
        managerToken = "Bearer " + jwtTokenProvider.generateAccessToken("manager_user", "MANAGER");
        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken("admin_user", "ADMIN");
    }

    @Test
    @DisplayName("Requirement 1: Unauthenticated request to protected endpoint gets 401 Unauthorized")
    void testUnauthenticated_Gets401() throws Exception {
        CreateCargoRequestDto payload = new CreateCargoRequestDto(
                1L, 75000.0, "AUSTRALIA_GLADSTONE", 1L, LocalDate.now().plusDays(30), "spot"
        );

        mockMvc.perform(post("/api/v1/cargo-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Requirement 2: VIEWER token gets 403 Forbidden on POST /api/v1/cargo-requests")
    void testViewerToken_Gets403_OnCreateCargoRequest() throws Exception {
        CreateCargoRequestDto payload = new CreateCargoRequestDto(
                1L, 75000.0, "AUSTRALIA_GLADSTONE", 1L, LocalDate.now().plusDays(30), "spot"
        );

        mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value(containsString("insufficient permissions")));

        verifyNoInteractions(cargoRequestService);
        verifyNoInteractions(auditLogService);
    }

    @Test
    @DisplayName("Requirement 3: MANAGER token succeeds on POST /api/v1/cargo-requests")
    void testManagerToken_Succeeds_OnCreateCargoRequest() throws Exception {
        CreateCargoRequestDto payload = new CreateCargoRequestDto(
                1L, 75000.0, "AUSTRALIA_GLADSTONE", 1L, LocalDate.now().plusDays(30), "spot"
        );

        DecisionChainResponseDto.RecommendationSummaryDto mockRec =
                new DecisionChainResponseDto.RecommendationSummaryDto(
                        10L, "SPLIT", 45.0, "{\"action\":\"SPLIT\",\"split_pct\":45}", OffsetDateTime.now()
                );

        DecisionChainResponseDto mockResponse = new DecisionChainResponseDto();
        mockResponse.setId(101L);
        mockResponse.setTonnage(75000.0);
        mockResponse.setStatus("PROCESSED");
        mockResponse.setRecommendation(mockRec);

        when(cargoRequestService.createAndProcessCargoRequest(any(CreateCargoRequestDto.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.status").value("PROCESSED"))
                .andExpect(jsonPath("$.recommendation.action").value("SPLIT"))
                .andExpect(jsonPath("$.recommendation.splitPct").value(45.0));

        verify(cargoRequestService, times(1)).createAndProcessCargoRequest(any(CreateCargoRequestDto.class));
    }

    @Test
    @DisplayName("Requirement 4: audit_logs row is created for every recommendation returned")
    void testAuditLogRowCreated_ForEveryRecommendationReturned() throws Exception {
        CreateCargoRequestDto payload = new CreateCargoRequestDto(
                1L, 75000.0, "AUSTRALIA_GLADSTONE", 1L, LocalDate.now().plusDays(30), "spot"
        );

        DecisionChainResponseDto.RecommendationSummaryDto mockRec =
                new DecisionChainResponseDto.RecommendationSummaryDto(
                        10L, "CHARTER_NOW", 100.0, "{\"action\":\"CHARTER_NOW\"}", OffsetDateTime.now()
                );

        DecisionChainResponseDto mockResponse = new DecisionChainResponseDto();
        mockResponse.setId(205L);
        mockResponse.setTonnage(75000.0);
        mockResponse.setStatus("PROCESSED");
        mockResponse.setRecommendation(mockRec);

        when(cargoRequestService.createAndProcessCargoRequest(any(CreateCargoRequestDto.class)))
                .thenReturn(mockResponse);

        // Execute as ANALYST
        mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", analystToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        // Assert audit log service was called with recommendation details
        ArgumentCaptor<Long> idCaptor = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<String> actionCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Double> splitCaptor = ArgumentCaptor.forClass(Double.class);

        verify(auditLogService, times(1)).logRecommendationShown(
                idCaptor.capture(),
                actionCaptor.capture(),
                splitCaptor.capture(),
                any()
        );

        assertEquals(205L, idCaptor.getValue());
        assertEquals("CHARTER_NOW", actionCaptor.getValue());
        assertEquals(100.0, splitCaptor.getValue());
    }

    @Test
    @DisplayName("Requirement 5: POST /api/v1/contracts allows MANAGER and records audit log")
    void testContractRecording_ByManager_CreatesAuditLog() throws Exception {
        CreateContractDto contractDto = new CreateContractDto(
                101L, "spot", 75000.0, 27.50
        );

        CargoRequest mockCargoRequest = new CargoRequest();
        mockCargoRequest.setId(101L);

        when(cargoRequestRepository.findById(101L)).thenReturn(Optional.of(mockCargoRequest));

        Contract savedContract = new Contract(
                55L, mockCargoRequest, ContractType.SPOT, 75000.0, 27.50, OffsetDateTime.now(), "EXECUTED"
        );
        when(contractRepository.save(any(Contract.class))).thenReturn(savedContract);

        mockMvc.perform(post("/api/v1/contracts")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(contractDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(55))
                .andExpect(jsonPath("$.status").value("EXECUTED"))
                .andExpect(jsonPath("$.fixedRate").value(27.50));

        verify(auditLogService, times(1)).logContractRecorded(
                eq(55L), eq(101L), eq("SPOT"), eq(75000.0), eq(27.50)
        );
    }

    @Test
    @DisplayName("Requirement 6: In-memory Rate Limiting returns 429 Too Many Requests when limit exceeded")
    void testRateLimiting_Returns429_WhenLimitExceeded() throws Exception {
        rateLimitingFilter.setMaxRequestsPerMinuteForTest(3);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/cargo-requests");
        request.setRemoteAddr("192.168.1.100");

        // First 3 requests should pass through
        for (int i = 0; i < 3; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();
            rateLimitingFilter.doFilter(request, response, chain);
            assertEquals(200, response.getStatus());
        }

        // 4th request must be blocked with HTTP 429 Too Many Requests
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        MockFilterChain blockedChain = new MockFilterChain();
        rateLimitingFilter.doFilter(request, blockedResponse, blockedChain);

        assertEquals(429, blockedResponse.getStatus());
        assertTrue(blockedResponse.getContentAsString().contains("Rate limit exceeded"));
        assertNotNull(blockedResponse.getHeader("Retry-After"));
    }

    @Test
    @DisplayName("Requirement 7: Tampered or invalid JWT signature is rejected with 401")
    void testTamperedToken_Gets401() throws Exception {
        String tamperedToken = "Bearer " + jwtTokenProvider.generateAccessToken("admin", "ADMIN") + "TAMPERED";

        CreateCargoRequestDto payload = new CreateCargoRequestDto(
                1L, 75000.0, "AUSTRALIA_GLADSTONE", 1L, LocalDate.now().plusDays(30), "spot"
        );

        mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", tamperedToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Requirement: When FastAPI is killed/down, endpoint returns 200 with degraded:true rather than 500 error")
    void testFastApiOutage_Returns200WithDegradedMode() throws Exception {
        CreateCargoRequestDto payload = new CreateCargoRequestDto(
                1L, 75000.0, "AUSTRALIA_GLADSTONE", 1L, LocalDate.now().plusDays(30), "spot"
        );

        DecisionChainResponseDto degradedResponse = new DecisionChainResponseDto();
        degradedResponse.setId(301L);
        degradedResponse.setStatus("DEGRADED");
        degradedResponse.setDegraded(true);

        DecisionChainResponseDto.ForecastSummaryDto cachedForecast =
                new DecisionChainResponseDto.ForecastSummaryDto(
                        101L, 28.50, 27.0, 30.0, 25.0, 33.0, 35.0, 60.0,
                        "cached_baseline_sarimax",
                        java.util.Map.of("status", "DEGRADED", "source", "Redis Cache"),
                        OffsetDateTime.now().toString()
                );
        degradedResponse.setForecast(cachedForecast);

        DecisionChainResponseDto.RecommendationSummaryDto rec =
                new DecisionChainResponseDto.RecommendationSummaryDto(
                        99L, "SPLIT", 50.0,
                        "{\"action\":\"SPLIT\",\"split_pct\":50,\"degraded\":true}",
                        OffsetDateTime.now()
                );
        degradedResponse.setRecommendation(rec);

        when(cargoRequestService.createAndProcessCargoRequest(any(CreateCargoRequestDto.class)))
                .thenReturn(degradedResponse);

        mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(301))
                .andExpect(jsonPath("$.degraded").value(true))
                .andExpect(jsonPath("$.status").value("DEGRADED"))
                .andExpect(jsonPath("$.forecast.expectedValueUsdPerTon").value(28.50))
                .andExpect(jsonPath("$.recommendation.splitPct").value(50.0));
    }
}

