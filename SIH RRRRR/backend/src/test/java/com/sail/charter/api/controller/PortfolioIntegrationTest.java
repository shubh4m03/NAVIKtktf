package com.sail.charter.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sail.charter.api.dto.PortfolioAllocationResponseDto;
import com.sail.charter.domain.repository.CargoRequestRepository;
import com.sail.charter.domain.repository.PortfolioAllocationRepository;
import com.sail.charter.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for Task 19 — Charter Portfolio Strategy (§13).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PortfolioIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CargoRequestRepository cargoRequestRepository;
    @Autowired private PortfolioAllocationRepository portfolioAllocationRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;

    private String analystToken;

    @BeforeEach
    void setUp() {
        analystToken = "Bearer " + jwtTokenProvider.generateAccessToken("analyst_user", "ANALYST");
    }

    private String getCargoRequestJson() {
        return """
            {
              "userId": 1,
              "tonnage": 75000,
              "originRegion": "AUSTRALIA_NEWCASTLE",
              "destinationPortId": 1,
              "deadline": "%s",
              "contractPreference": "spot"
            }
            """.formatted(LocalDate.now().plusDays(60).toString());
    }

    private long createCargoRequest() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/cargo-requests")
                        .header("Authorization", analystToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(getCargoRequestJson()))
                .andExpect(status().isOk())
                .andReturn();
        String json = result.getResponse().getContentAsString();
        return objectMapper.readTree(json).get("id").asLong();
    }

    @Test
    void test_portfolio_conservative_label() throws Exception {
        long cargoId = createCargoRequest();

        MvcResult res = mockMvc.perform(post("/api/v1/cargo-requests/" + cargoId + "/portfolio")
                        .header("Authorization", analystToken)
                        .param("lambda", "1.0"))
                .andExpect(status().isOk())
                .andReturn();

        PortfolioAllocationResponseDto dto = objectMapper.readValue(
                res.getResponse().getContentAsString(), PortfolioAllocationResponseDto.class);

        assertThat(dto.getLambdaLabel()).isEqualTo("Conservative");
        assertThat(dto.getSpotPct()).isNotNull().isGreaterThanOrEqualTo(0.0);
        assertThat(dto.getMediumTermPct()).isNotNull().isGreaterThanOrEqualTo(0.0);
    }

    @Test
    void test_portfolio_aggressive_label() throws Exception {
        long cargoId = createCargoRequest();

        MvcResult res = mockMvc.perform(post("/api/v1/cargo-requests/" + cargoId + "/portfolio")
                        .header("Authorization", analystToken)
                        .param("lambda", "0.1"))
                .andExpect(status().isOk())
                .andReturn();

        PortfolioAllocationResponseDto dto = objectMapper.readValue(
                res.getResponse().getContentAsString(), PortfolioAllocationResponseDto.class);

        assertThat(dto.getLambdaLabel()).isEqualTo("Aggressive");
    }

    @Test
    void test_allocations_sum_to_100_pct() throws Exception {
        long cargoId = createCargoRequest();

        for (String lambda : new String[]{"0.1", "0.5", "1.0"}) {
            MvcResult res = mockMvc.perform(post("/api/v1/cargo-requests/" + cargoId + "/portfolio")
                            .header("Authorization", analystToken)
                            .param("lambda", lambda))
                    .andExpect(status().isOk())
                    .andReturn();

            PortfolioAllocationResponseDto dto = objectMapper.readValue(
                    res.getResponse().getContentAsString(), PortfolioAllocationResponseDto.class);

            double total = dto.getSpotPct() + dto.getShortTermPct() + dto.getMediumTermPct();
            assertThat(total).withFailMessage(
                    "Allocations summed to %.2f%% for lambda=%s (expected 100)", total, lambda
            ).isBetween(99.9, 100.1);
        }
    }

    @Test
    void test_analyst_can_access_portfolio() throws Exception {
        long cargoId = createCargoRequest();
        mockMvc.perform(post("/api/v1/cargo-requests/" + cargoId + "/portfolio")
                        .header("Authorization", analystToken)
                        .param("lambda", "0.5"))
                .andExpect(status().isOk());
    }

    @Test
    void test_unauthenticated_gets_401() throws Exception {
        mockMvc.perform(get("/api/v1/cargo-requests/1/portfolio"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void test_get_returns_portfolio() throws Exception {
        long cargoId = createCargoRequest();
        mockMvc.perform(get("/api/v1/cargo-requests/" + cargoId + "/portfolio")
                        .header("Authorization", analystToken))
                .andExpect(status().isOk());
    }


    @Test
    void test_conservative_higher_medium_term_than_aggressive() throws Exception {
        long cargoId = createCargoRequest();

        MvcResult conservativeRes = mockMvc.perform(post("/api/v1/cargo-requests/" + cargoId + "/portfolio")
                        .header("Authorization", analystToken)
                        .param("lambda", "1.0"))
                .andExpect(status().isOk())
                .andReturn();

        long cargoId2 = createCargoRequest();
        MvcResult aggressiveRes = mockMvc.perform(post("/api/v1/cargo-requests/" + cargoId2 + "/portfolio")
                        .header("Authorization", analystToken)
                        .param("lambda", "0.1"))
                .andExpect(status().isOk())
                .andReturn();

        PortfolioAllocationResponseDto conservativeDto = objectMapper.readValue(
                conservativeRes.getResponse().getContentAsString(), PortfolioAllocationResponseDto.class);
        PortfolioAllocationResponseDto aggressiveDto = objectMapper.readValue(
                aggressiveRes.getResponse().getContentAsString(), PortfolioAllocationResponseDto.class);

        assertThat(conservativeDto.getMediumTermPct())
                .withFailMessage("Conservative medium_term_pct (%.2f) should be >= aggressive (%.2f)",
                        conservativeDto.getMediumTermPct(), aggressiveDto.getMediumTermPct())
                .isGreaterThanOrEqualTo(aggressiveDto.getMediumTermPct());
    }
}
