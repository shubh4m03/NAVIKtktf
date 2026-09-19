package com.sail.charter.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "vessel_rankings")
public class VesselRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forecast_run_id", nullable = false)
    private ForecastRun forecastRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vessel_class_id", nullable = false)
    private VesselClass vesselClass;

    @Column(name = "score")
    private Double score;

    @Column(name = "estimated_landed_cost")
    private Double estimatedLandedCost;

    @Column(name = "expected_delay_days")
    private Double expectedDelayDays;

    @Column(nullable = false)
    private Boolean feasible;

    @Column(name = "infeasibility_reason", length = 500)
    private String infeasibilityReason;

    public VesselRanking() {}

    public VesselRanking(Long id, ForecastRun forecastRun, VesselClass vesselClass, Double score,
                         Double estimatedLandedCost, Double expectedDelayDays, Boolean feasible, String infeasibilityReason) {
        this.id = id;
        this.forecastRun = forecastRun;
        this.vesselClass = vesselClass;
        this.score = score;
        this.estimatedLandedCost = estimatedLandedCost;
        this.expectedDelayDays = expectedDelayDays;
        this.feasible = feasible;
        this.infeasibilityReason = infeasibilityReason;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ForecastRun getForecastRun() { return forecastRun; }
    public void setForecastRun(ForecastRun forecastRun) { this.forecastRun = forecastRun; }

    public VesselClass getVesselClass() { return vesselClass; }
    public void setVesselClass(VesselClass vesselClass) { this.vesselClass = vesselClass; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getEstimatedLandedCost() { return estimatedLandedCost; }
    public void setEstimatedLandedCost(Double estimatedLandedCost) { this.estimatedLandedCost = estimatedLandedCost; }

    public Double getExpectedDelayDays() { return expectedDelayDays; }
    public void setExpectedDelayDays(Double expectedDelayDays) { this.expectedDelayDays = expectedDelayDays; }

    public Boolean getFeasible() { return feasible; }
    public void setFeasible(Boolean feasible) { this.feasible = feasible; }

    public String getInfeasibilityReason() { return infeasibilityReason; }
    public void setInfeasibilityReason(String infeasibilityReason) { this.infeasibilityReason = infeasibilityReason; }
}
