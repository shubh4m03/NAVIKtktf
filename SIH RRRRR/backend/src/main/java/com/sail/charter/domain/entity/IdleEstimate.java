package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Entity mapping for idle_estimates table (Task 18 / Section 10).
 */
@Entity
@Table(name = "idle_estimates")
public class IdleEstimate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cargo_request_id")
    private CargoRequest cargoRequest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "discharge_port_id", nullable = false)
    private Port dischargePort;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vessel_class_id", nullable = false)
    private VesselClass vesselClass;

    @Column(name = "estimated_arrival_date", nullable = false)
    private LocalDate estimatedArrivalDate;

    @Column(name = "turnaround_days", nullable = false)
    private Double turnaroundDays;

    @Column(name = "available_date", nullable = false)
    private LocalDate availableDate;

    @Column(name = "opportunity_lanes_json", columnDefinition = "TEXT", nullable = false)
    private String opportunityLanesJson;

    @Column(name = "disclaimer", length = 500, nullable = false)
    private String disclaimer;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public IdleEstimate() {}

    public IdleEstimate(Long id, CargoRequest cargoRequest, Port dischargePort, VesselClass vesselClass,
                        LocalDate estimatedArrivalDate, Double turnaroundDays, LocalDate availableDate,
                        String opportunityLanesJson, String disclaimer, OffsetDateTime createdAt) {
        this.id = id;
        this.cargoRequest = cargoRequest;
        this.dischargePort = dischargePort;
        this.vesselClass = vesselClass;
        this.estimatedArrivalDate = estimatedArrivalDate;
        this.turnaroundDays = turnaroundDays;
        this.availableDate = availableDate;
        this.opportunityLanesJson = opportunityLanesJson;
        this.disclaimer = disclaimer;
        this.createdAt = createdAt != null ? createdAt : OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CargoRequest getCargoRequest() { return cargoRequest; }
    public void setCargoRequest(CargoRequest cargoRequest) { this.cargoRequest = cargoRequest; }

    public Port getDischargePort() { return dischargePort; }
    public void setDischargePort(Port dischargePort) { this.dischargePort = dischargePort; }

    public VesselClass getVesselClass() { return vesselClass; }
    public void setVesselClass(VesselClass vesselClass) { this.vesselClass = vesselClass; }

    public LocalDate getEstimatedArrivalDate() { return estimatedArrivalDate; }
    public void setEstimatedArrivalDate(LocalDate estimatedArrivalDate) { this.estimatedArrivalDate = estimatedArrivalDate; }

    public Double getTurnaroundDays() { return turnaroundDays; }
    public void setTurnaroundDays(Double turnaroundDays) { this.turnaroundDays = turnaroundDays; }

    public LocalDate getAvailableDate() { return availableDate; }
    public void setAvailableDate(LocalDate availableDate) { this.availableDate = availableDate; }

    public String getOpportunityLanesJson() { return opportunityLanesJson; }
    public void setOpportunityLanesJson(String opportunityLanesJson) { this.opportunityLanesJson = opportunityLanesJson; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
