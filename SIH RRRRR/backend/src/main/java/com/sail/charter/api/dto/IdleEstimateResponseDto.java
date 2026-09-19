package com.sail.charter.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public class IdleEstimateResponseDto {

    private Long id;
    private Long cargoRequestId;
    private Long dischargePortId;
    private String dischargePortName;
    private Long vesselClassId;
    private String vesselClassName;
    private LocalDate estimatedArrivalDate;
    private Double turnaroundDays;
    private Double handlingDays;
    private Double queueDays;
    private LocalDate availableDate;
    private List<OpportunityLaneDto> opportunityLanes;
    private String disclaimer;
    private Map<String, String> dataProvenance;
    private OffsetDateTime createdAt;

    public IdleEstimateResponseDto() {}

    public IdleEstimateResponseDto(Long id, Long cargoRequestId, Long dischargePortId, String dischargePortName,
                                   Long vesselClassId, String vesselClassName, LocalDate estimatedArrivalDate,
                                   Double turnaroundDays, Double handlingDays, Double queueDays,
                                   LocalDate availableDate, List<OpportunityLaneDto> opportunityLanes,
                                   String disclaimer, Map<String, String> dataProvenance,
                                   OffsetDateTime createdAt) {
        this.id = id;
        this.cargoRequestId = cargoRequestId;
        this.dischargePortId = dischargePortId;
        this.dischargePortName = dischargePortName;
        this.vesselClassId = vesselClassId;
        this.vesselClassName = vesselClassName;
        this.estimatedArrivalDate = estimatedArrivalDate;
        this.turnaroundDays = turnaroundDays;
        this.handlingDays = handlingDays;
        this.queueDays = queueDays;
        this.availableDate = availableDate;
        this.opportunityLanes = opportunityLanes;
        this.disclaimer = disclaimer;
        this.dataProvenance = dataProvenance;
        this.createdAt = createdAt != null ? createdAt : OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCargoRequestId() { return cargoRequestId; }
    public void setCargoRequestId(Long cargoRequestId) { this.cargoRequestId = cargoRequestId; }

    public Long getDischargePortId() { return dischargePortId; }
    public void setDischargePortId(Long dischargePortId) { this.dischargePortId = dischargePortId; }

    public String getDischargePortName() { return dischargePortName; }
    public void setDischargePortName(String dischargePortName) { this.dischargePortName = dischargePortName; }

    public Long getVesselClassId() { return vesselClassId; }
    public void setVesselClassId(Long vesselClassId) { this.vesselClassId = vesselClassId; }

    public String getVesselClassName() { return vesselClassName; }
    public void setVesselClassName(String vesselClassName) { this.vesselClassName = vesselClassName; }

    public LocalDate getEstimatedArrivalDate() { return estimatedArrivalDate; }
    public void setEstimatedArrivalDate(LocalDate estimatedArrivalDate) { this.estimatedArrivalDate = estimatedArrivalDate; }

    public Double getTurnaroundDays() { return turnaroundDays; }
    public void setTurnaroundDays(Double turnaroundDays) { this.turnaroundDays = turnaroundDays; }

    public Double getHandlingDays() { return handlingDays; }
    public void setHandlingDays(Double handlingDays) { this.handlingDays = handlingDays; }

    public Double getQueueDays() { return queueDays; }
    public void setQueueDays(Double queueDays) { this.queueDays = queueDays; }

    public LocalDate getAvailableDate() { return availableDate; }
    public void setAvailableDate(LocalDate availableDate) { this.availableDate = availableDate; }

    public List<OpportunityLaneDto> getOpportunityLanes() { return opportunityLanes; }
    public void setOpportunityLanes(List<OpportunityLaneDto> opportunityLanes) { this.opportunityLanes = opportunityLanes; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public Map<String, String> getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(Map<String, String> dataProvenance) { this.dataProvenance = dataProvenance; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
