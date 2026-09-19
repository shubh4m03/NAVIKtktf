package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "forecast_runs", indexes = {
    @Index(name = "idx_forecast_runs_lookup", columnList = "route_id, vessel_class_id, generated_at")
})
public class ForecastRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cargo_request_id")
    private CargoRequest cargoRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vessel_class_id", nullable = false)
    private VesselClass vesselClass;

    @Column(name = "model_used", nullable = false, length = 100)
    private String modelUsed;

    @Column(name = "generated_at")
    private OffsetDateTime generatedAt = OffsetDateTime.now();

    public ForecastRun() {}

    public ForecastRun(Long id, CargoRequest cargoRequest, Route route, VesselClass vesselClass, String modelUsed, OffsetDateTime generatedAt) {
        this.id = id;
        this.cargoRequest = cargoRequest;
        this.route = route;
        this.vesselClass = vesselClass;
        this.modelUsed = modelUsed;
        this.generatedAt = generatedAt != null ? generatedAt : OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CargoRequest getCargoRequest() { return cargoRequest; }
    public void setCargoRequest(CargoRequest cargoRequest) { this.cargoRequest = cargoRequest; }

    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }

    public VesselClass getVesselClass() { return vesselClass; }
    public void setVesselClass(VesselClass vesselClass) { this.vesselClass = vesselClass; }

    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }

    public OffsetDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(OffsetDateTime generatedAt) { this.generatedAt = generatedAt; }
}
