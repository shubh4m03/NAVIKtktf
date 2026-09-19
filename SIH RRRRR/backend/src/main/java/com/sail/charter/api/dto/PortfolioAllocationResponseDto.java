package com.sail.charter.api.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * API response DTO for Task 19 portfolio allocation results.
 * Returned by GET /api/v1/cargo-requests/{id}/portfolio
 * and embedded in DecisionChainResponseDto.portfolioAllocation.
 */
public class PortfolioAllocationResponseDto {

    private Long id;
    private Long cargoRequestId;
    private Double riskAversionLambda;
    private String lambdaLabel;
    private Double spotPct;
    private Double shortTermPct;
    private Double mediumTermPct;
    private Double totalExpectedCostUsd;
    private Double portfolioVariance;
    private Double objectiveValue;
    private String solverUsed;
    private List<Map<String, Object>> allocations;
    private Map<String, Object> assumptions;
    private String disclaimer;
    private Map<String, String> dataProvenance;
    private OffsetDateTime createdAt;

    public PortfolioAllocationResponseDto() {}

    public PortfolioAllocationResponseDto(Long id, Long cargoRequestId, Double riskAversionLambda,
                                           String lambdaLabel, Double spotPct, Double shortTermPct,
                                           Double mediumTermPct, Double totalExpectedCostUsd,
                                           Double portfolioVariance, Double objectiveValue, String solverUsed,
                                           List<Map<String, Object>> allocations,
                                           Map<String, Object> assumptions, String disclaimer,
                                           Map<String, String> dataProvenance, OffsetDateTime createdAt) {
        this.id = id;
        this.cargoRequestId = cargoRequestId;
        this.riskAversionLambda = riskAversionLambda;
        this.lambdaLabel = lambdaLabel;
        this.spotPct = spotPct;
        this.shortTermPct = shortTermPct;
        this.mediumTermPct = mediumTermPct;
        this.totalExpectedCostUsd = totalExpectedCostUsd;
        this.portfolioVariance = portfolioVariance;
        this.objectiveValue = objectiveValue;
        this.solverUsed = solverUsed;
        this.allocations = allocations;
        this.assumptions = assumptions;
        this.disclaimer = disclaimer;
        this.dataProvenance = dataProvenance;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCargoRequestId() { return cargoRequestId; }
    public void setCargoRequestId(Long v) { this.cargoRequestId = v; }

    public Double getRiskAversionLambda() { return riskAversionLambda; }
    public void setRiskAversionLambda(Double v) { this.riskAversionLambda = v; }

    public String getLambdaLabel() { return lambdaLabel; }
    public void setLambdaLabel(String v) { this.lambdaLabel = v; }

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

    public String getSolverUsed() { return solverUsed; }
    public void setSolverUsed(String v) { this.solverUsed = v; }

    public List<Map<String, Object>> getAllocations() { return allocations; }
    public void setAllocations(List<Map<String, Object>> v) { this.allocations = v; }

    public Map<String, Object> getAssumptions() { return assumptions; }
    public void setAssumptions(Map<String, Object> v) { this.assumptions = v; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String v) { this.disclaimer = v; }

    public Map<String, String> getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(Map<String, String> v) { this.dataProvenance = v; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { this.createdAt = v; }
}
