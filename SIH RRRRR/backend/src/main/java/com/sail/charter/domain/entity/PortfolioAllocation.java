package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "portfolio_allocations",
        indexes = @Index(name = "idx_portfolio_alloc_cargo_id", columnList = "cargo_request_id"))
public class PortfolioAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // EAGER fetch — accessed outside JPA transaction in DTO mapping layer.
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cargo_request_id", nullable = false)
    private CargoRequest cargoRequest;

    @Column(name = "risk_aversion_lambda", nullable = false)
    private Double riskAversionLambda;

    @Column(name = "lambda_label", nullable = false, length = 20)
    private String lambdaLabel;

    @Column(name = "spot_pct", nullable = false)
    private Double spotPct;

    @Column(name = "short_term_pct", nullable = false)
    private Double shortTermPct;

    @Column(name = "medium_term_pct", nullable = false)
    private Double mediumTermPct;

    @Column(name = "total_expected_cost_usd", nullable = false)
    private Double totalExpectedCostUsd;

    @Column(name = "portfolio_variance", nullable = false)
    private Double portfolioVariance;

    @Column(name = "objective_value", nullable = false)
    private Double objectiveValue;

    @Column(name = "solver_used", nullable = false, length = 50)
    private String solverUsed;

    @Column(name = "allocations_json", columnDefinition = "TEXT")
    private String allocationsJson;

    @Column(name = "assumptions_json", columnDefinition = "TEXT")
    private String assumptionsJson;

    @Column(name = "disclaimer", columnDefinition = "TEXT")
    private String disclaimer;

    @Column(name = "data_provenance_json", columnDefinition = "TEXT")
    private String dataProvenanceJson;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public PortfolioAllocation() {}

    public PortfolioAllocation(Long id, CargoRequest cargoRequest, Double riskAversionLambda,
                                String lambdaLabel, Double spotPct, Double shortTermPct,
                                Double mediumTermPct, Double totalExpectedCostUsd,
                                Double portfolioVariance, Double objectiveValue, String solverUsed,
                                String allocationsJson, String assumptionsJson, String disclaimer,
                                String dataProvenanceJson, OffsetDateTime createdAt) {
        this.id = id;
        this.cargoRequest = cargoRequest;
        this.riskAversionLambda = riskAversionLambda;
        this.lambdaLabel = lambdaLabel;
        this.spotPct = spotPct;
        this.shortTermPct = shortTermPct;
        this.mediumTermPct = mediumTermPct;
        this.totalExpectedCostUsd = totalExpectedCostUsd;
        this.portfolioVariance = portfolioVariance;
        this.objectiveValue = objectiveValue;
        this.solverUsed = solverUsed;
        this.allocationsJson = allocationsJson;
        this.assumptionsJson = assumptionsJson;
        this.disclaimer = disclaimer;
        this.dataProvenanceJson = dataProvenanceJson;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CargoRequest getCargoRequest() { return cargoRequest; }
    public void setCargoRequest(CargoRequest cargoRequest) { this.cargoRequest = cargoRequest; }

    public Double getRiskAversionLambda() { return riskAversionLambda; }
    public void setRiskAversionLambda(Double riskAversionLambda) { this.riskAversionLambda = riskAversionLambda; }

    public String getLambdaLabel() { return lambdaLabel; }
    public void setLambdaLabel(String lambdaLabel) { this.lambdaLabel = lambdaLabel; }

    public Double getSpotPct() { return spotPct; }
    public void setSpotPct(Double spotPct) { this.spotPct = spotPct; }

    public Double getShortTermPct() { return shortTermPct; }
    public void setShortTermPct(Double shortTermPct) { this.shortTermPct = shortTermPct; }

    public Double getMediumTermPct() { return mediumTermPct; }
    public void setMediumTermPct(Double mediumTermPct) { this.mediumTermPct = mediumTermPct; }

    public Double getTotalExpectedCostUsd() { return totalExpectedCostUsd; }
    public void setTotalExpectedCostUsd(Double totalExpectedCostUsd) { this.totalExpectedCostUsd = totalExpectedCostUsd; }

    public Double getPortfolioVariance() { return portfolioVariance; }
    public void setPortfolioVariance(Double portfolioVariance) { this.portfolioVariance = portfolioVariance; }

    public Double getObjectiveValue() { return objectiveValue; }
    public void setObjectiveValue(Double objectiveValue) { this.objectiveValue = objectiveValue; }

    public String getSolverUsed() { return solverUsed; }
    public void setSolverUsed(String solverUsed) { this.solverUsed = solverUsed; }

    public String getAllocationsJson() { return allocationsJson; }
    public void setAllocationsJson(String allocationsJson) { this.allocationsJson = allocationsJson; }

    public String getAssumptionsJson() { return assumptionsJson; }
    public void setAssumptionsJson(String assumptionsJson) { this.assumptionsJson = assumptionsJson; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public String getDataProvenanceJson() { return dataProvenanceJson; }
    public void setDataProvenanceJson(String dataProvenanceJson) { this.dataProvenanceJson = dataProvenanceJson; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
