package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request DTO sent from Spring Boot to FastAPI
 * POST /internal/v1/optimize/portfolio  (Task 19 / §13).
 */
public class PortfolioRequestDto {

    @JsonProperty("expected_rate_usd_per_mt")
    private Double expectedRateUsdPerMt;

    @JsonProperty("q_05")
    private Double q05;

    @JsonProperty("q_95")
    private Double q95;

    @JsonProperty("tonnage_mt")
    private Double tonnageMt;

    @JsonProperty("risk_aversion_lambda")
    private Double riskAversionLambda;

    public PortfolioRequestDto() {}

    public PortfolioRequestDto(Double expectedRateUsdPerMt, Double q05, Double q95,
                                Double tonnageMt, Double riskAversionLambda) {
        this.expectedRateUsdPerMt = expectedRateUsdPerMt;
        this.q05 = q05;
        this.q95 = q95;
        this.tonnageMt = tonnageMt;
        this.riskAversionLambda = riskAversionLambda;
    }

    public Double getExpectedRateUsdPerMt() { return expectedRateUsdPerMt; }
    public void setExpectedRateUsdPerMt(Double v) { this.expectedRateUsdPerMt = v; }

    public Double getQ05() { return q05; }
    public void setQ05(Double v) { this.q05 = v; }

    public Double getQ95() { return q95; }
    public void setQ95(Double v) { this.q95 = v; }

    public Double getTonnageMt() { return tonnageMt; }
    public void setTonnageMt(Double v) { this.tonnageMt = v; }

    public Double getRiskAversionLambda() { return riskAversionLambda; }
    public void setRiskAversionLambda(Double v) { this.riskAversionLambda = v; }
}
