package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cargo_request_id", nullable = false)
    private CargoRequest cargoRequest;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "split_pct")
    private Double splitPct;

    @Column(name = "rationale_json", columnDefinition = "TEXT")
    private String rationaleJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forecast_run_id")
    private ForecastRun forecastRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_event_id")
    private RiskEvent riskEvent;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Recommendation() {}

    public Recommendation(Long id, CargoRequest cargoRequest, String action, Double splitPct,
                          String rationaleJson, ForecastRun forecastRun, RiskEvent riskEvent, OffsetDateTime createdAt) {
        this.id = id;
        this.cargoRequest = cargoRequest;
        this.action = action;
        this.splitPct = splitPct;
        this.rationaleJson = rationaleJson;
        this.forecastRun = forecastRun;
        this.riskEvent = riskEvent;
        this.createdAt = createdAt != null ? createdAt : OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CargoRequest getCargoRequest() { return cargoRequest; }
    public void setCargoRequest(CargoRequest cargoRequest) { this.cargoRequest = cargoRequest; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public Double getSplitPct() { return splitPct; }
    public void setSplitPct(Double splitPct) { this.splitPct = splitPct; }

    public String getRationaleJson() { return rationaleJson; }
    public void setRationaleJson(String rationaleJson) { this.rationaleJson = rationaleJson; }

    public ForecastRun getForecastRun() { return forecastRun; }
    public void setForecastRun(ForecastRun forecastRun) { this.forecastRun = forecastRun; }

    public RiskEvent getRiskEvent() { return riskEvent; }
    public void setRiskEvent(RiskEvent riskEvent) { this.riskEvent = riskEvent; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
