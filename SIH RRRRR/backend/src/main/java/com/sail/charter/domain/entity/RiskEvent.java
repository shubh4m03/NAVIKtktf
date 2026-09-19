package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "risk_events")
public class RiskEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cargo_request_id", nullable = false)
    private CargoRequest cargoRequest;

    @Column(name = "risk_score", nullable = false)
    private Double riskScore;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "top_drivers_json", columnDefinition = "TEXT")
    private String topDriversJson;

    @Column(name = "mitigation_suggestion", columnDefinition = "TEXT")
    private String mitigationSuggestion;

    @Column(name = "computed_at")
    private OffsetDateTime computedAt = OffsetDateTime.now();

    public RiskEvent() {}

    public RiskEvent(Long id, CargoRequest cargoRequest, Double riskScore, String category,
                     String topDriversJson, String mitigationSuggestion, OffsetDateTime computedAt) {
        this.id = id;
        this.cargoRequest = cargoRequest;
        this.riskScore = riskScore;
        this.category = category;
        this.topDriversJson = topDriversJson;
        this.mitigationSuggestion = mitigationSuggestion;
        this.computedAt = computedAt != null ? computedAt : OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CargoRequest getCargoRequest() { return cargoRequest; }
    public void setCargoRequest(CargoRequest cargoRequest) { this.cargoRequest = cargoRequest; }

    public Double getRiskScore() { return riskScore; }
    public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTopDriversJson() { return topDriversJson; }
    public void setTopDriversJson(String topDriversJson) { this.topDriversJson = topDriversJson; }

    public String getMitigationSuggestion() { return mitigationSuggestion; }
    public void setMitigationSuggestion(String mitigationSuggestion) { this.mitigationSuggestion = mitigationSuggestion; }

    public OffsetDateTime getComputedAt() { return computedAt; }
    public void setComputedAt(OffsetDateTime computedAt) { this.computedAt = computedAt; }
}
