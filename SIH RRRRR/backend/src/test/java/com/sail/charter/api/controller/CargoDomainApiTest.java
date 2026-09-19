package com.sail.charter.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sail.charter.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CargoDomainApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String managerToken;

    @BeforeEach
    void setUp() {
        managerToken = "Bearer " + jwtTokenProvider.generateAccessToken("manager_user", "MANAGER");
    }

    @Test
    @DisplayName("Happy path: POST /api/v1/cargo-requests returns 201 with generated id")
    void testCreateCargoRequest_HappyPath() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("tonnage", 75000.0);
        request.put("originRegion", "AUSTRALIA_GLADSTONE");
        request.put("destinationPortId", 1L); // Paradip
        request.put("deadline", LocalDate.now().plusDays(30).toString());
        request.put("contractPreference", "spot");

        mockMvc.perform(post("/api/v1/cargo-requests")
                .header("Authorization", managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().is2xxSuccessful())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.id").value(greaterThan(0)))
            .andExpect(jsonPath("$.tonnage").value(75000.0))
            .andExpect(jsonPath("$.originRegion").value("AUSTRALIA_GLADSTONE"))
            .andExpect(jsonPath("$.destinationPortId").value(1))
            .andExpect(jsonPath("$.destinationPortName").value("Paradip"))
            .andExpect(jsonPath("$.status").exists());

    }

    @Test
    @DisplayName("Validation failure 1: Negative tonnage returns 400 with field details")
    void testCreateCargoRequest_NegativeTonnage() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("tonnage", -50000.0);
        request.put("originRegion", "AUSTRALIA_GLADSTONE");
        request.put("destinationPortId", 1L);
        request.put("deadline", LocalDate.now().plusDays(30).toString());

        mockMvc.perform(post("/api/v1/cargo-requests")
                .header("Authorization", managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Bad Request"))
            .andExpect(jsonPath("$.fieldErrors.tonnage").exists())
            .andExpect(jsonPath("$.fieldErrors.tonnage", containsString("positive")));
    }

    @Test
    @DisplayName("Validation failure 2: Missing destination returns 400 with field details")
    void testCreateCargoRequest_MissingDestination() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("tonnage", 50000.0);
        request.put("originRegion", "AUSTRALIA_GLADSTONE");
        request.put("destinationPortId", null);
        request.put("deadline", LocalDate.now().plusDays(30).toString());

        mockMvc.perform(post("/api/v1/cargo-requests")
                .header("Authorization", managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Bad Request"))
            .andExpect(jsonPath("$.fieldErrors.destinationPortId").exists());
    }

    @Test
    @DisplayName("Validation failure 3: Past deadline returns 400 with field details")
    void testCreateCargoRequest_PastDeadline() throws Exception {
        Map<String, Object> request = new HashMap<>();
        request.put("tonnage", 50000.0);
        request.put("originRegion", "AUSTRALIA_GLADSTONE");
        request.put("destinationPortId", 1L);
        request.put("deadline", LocalDate.now().minusDays(5).toString());

        mockMvc.perform(post("/api/v1/cargo-requests")
                .header("Authorization", managerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.error").value("Bad Request"))
            .andExpect(jsonPath("$.fieldErrors.deadline").exists())
            .andExpect(jsonPath("$.fieldErrors.deadline", containsString("future")));
    }

    @Test
    @DisplayName("GET /api/v1/ports/{id} returns 200 with port constraints and data provenance")
    void testGetPortById_Success() throws Exception {
        mockMvc.perform(get("/api/v1/ports/1")
                .header("Authorization", managerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Paradip"))
            .andExpect(jsonPath("$.code").value("PRT"))
            .andExpect(jsonPath("$.constraints").isArray())
            .andExpect(jsonPath("$.constraints", hasSize(greaterThanOrEqualTo(1))))
            .andExpect(jsonPath("$.constraints[0].dataProvenance").value("REAL_VERIFIED"))
            .andExpect(jsonPath("$.constraints[0].maxDraftM").value(14.5));
    }

    @Test
    @DisplayName("GET /api/v1/ports/{id} returns 404 when port does not exist")
    void testGetPortById_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/ports/999")
                .header("Authorization", managerToken))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.error").value("Not Found"))
            .andExpect(jsonPath("$.message", containsString("Port not found with id: 999")));
    }

    @Test
    @DisplayName("GET /api/v1/vessel-classes returns 200 with 4 reference vessel classes")
    void testGetVesselClasses_Success() throws Exception {
        mockMvc.perform(get("/api/v1/vessel-classes")
                .header("Authorization", managerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", isA(java.util.List.class)))
            .andExpect(jsonPath("$", hasSize(4)))
            .andExpect(jsonPath("$[*].name", hasItems("Handysize", "Supramax", "Panamax", "Capesize")));
    }
}
