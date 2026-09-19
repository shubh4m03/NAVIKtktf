package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

/**
 * Response DTO received from FastAPI
 * POST /internal/v1/optimize/portfolio  (Task 19 / §13).
 */
public class PortfolioResponseDto {

    @JsonProperty("spot_pct")
    private Double spotPct;

    @JsonProperty("short_term_pct")
    private Double shortTermPct;

    @JsonProperty("medium_term_pct")
    private Double mediumTermPct;

    @JsonProperty("total_expected_cost_usd")
    private Double totalExpectedCostUsd;

    @JsonProperty("portfolio_variance")
    private Double portfolioVariance;

    @JsonProperty("objective_value")
    private Double objectiveValue;

    @JsonProperty("risk_aversion_lambda")
    private Double riskAversionLambda;

    @JsonProperty("lambda_label")
    private String lambdaLabel;

    @JsonProperty("solver_used")
    private String solverUsed;

    @JsonProperty("allocations")
    private List<Map<String, Object>> allocations;

    @JsonProperty("data_provenance")
    private Map<String, String> dataProvenance;

    @JsonProperty("disclaimer")
    private String disclaimer;

    @JsonProperty("assumptions")
    private Map<String, Object> assumptions;

    public PortfolioResponseDto() {}

    public Double getSpotPct() { return spotPct; }
    public void setSpotPct(Double v) { this.spotPct = v; }

    public Double getShortTermPct() { return shortTermPct; }
    public void setShortTermPct(Double v) { this.shortTermPct = v; }

    public Double getMediumTermPct() { return mediumTermPct; }
    public void setMediumTermPct(Double v) { this.mediumTermPct = v; }

    public Double getTotalExpectedCostUsd() { return totalExpectedCostUsd; }
    public void setTotalExpectedCostUsd(Double v) { this.totalExpectedCostUsd = v; }

    public Double getPortfolioVariance() { return portfolioVariance; }
    public void setPortfolioVariance(Double v) { this.portfolioVariance = v; }

    public Double getObjectiveValue() { return objectiveValue; }
    public void setObjectiveValue(Double v) { this.objectiveValue = v; }

    public Double getRiskAversionLambda() { return riskAversionLambda; }
    public void setRiskAversionLambda(Double v) { this.riskAversionLambda = v; }

    public String getLambdaLabel() { return lambdaLabel; }
    public void setLambdaLabel(String v) { this.lambdaLabel = v; }

    public String getSolverUsed() { return solverUsed; }
    public void setSolverUsed(String v) { this.solverUsed = v; }

    public List<Map<String, Object>> getAllocations() { return allocations; }
    public void setAllocations(List<Map<String, Object>> v) { this.allocations = v; }

    public Map<String, String> getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(Map<String, String> v) { this.dataProvenance = v; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String v) { this.disclaimer = v; }

    public Map<String, Object> getAssumptions() { return assumptions; }
    public void setAssumptions(Map<String, Object> v) { this.assumptions = v; }
}
