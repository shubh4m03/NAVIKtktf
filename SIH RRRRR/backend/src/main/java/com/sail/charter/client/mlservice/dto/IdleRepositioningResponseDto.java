package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sail.charter.api.dto.OpportunityLaneDto;
import java.util.List;
import java.util.Map;

public class IdleRepositioningResponseDto {

    @JsonProperty("discharge_port_id")
    private Long dischargePortId;

    @JsonProperty("discharge_port_name")
    private String dischargePortName;

    @JsonProperty("vessel_class_id")
    private Long vesselClassId;

    @JsonProperty("vessel_class_name")
    private String vesselClassName;

    @JsonProperty("cargo_tonnage")
    private Double cargoTonnage;

    @JsonProperty("estimated_arrival_date")
    private String estimatedArrivalDate;

    @JsonProperty("turnaround_days")
    private Double turnaroundDays;

    @JsonProperty("handling_days")
    private Double handlingDays;

    @JsonProperty("queue_days")
    private Double queueDays;

    @JsonProperty("available_date")
    private String availableDate;

    @JsonProperty("opportunity_lanes")
    private List<OpportunityLaneDto> opportunityLanes;

    @JsonProperty("disclaimer")
    private String disclaimer;

    @JsonProperty("data_provenance")
    private Map<String, String> dataProvenance;

    public IdleRepositioningResponseDto() {}

    public IdleRepositioningResponseDto(Long dischargePortId, String dischargePortName,
                                        Long vesselClassId, String vesselClassName,
                                        Double cargoTonnage, String estimatedArrivalDate,
                                        Double turnaroundDays, Double handlingDays,
                                        Double queueDays, String availableDate,
                                        List<OpportunityLaneDto> opportunityLanes,
                                        String disclaimer, Map<String, String> dataProvenance) {
        this.dischargePortId = dischargePortId;
        this.dischargePortName = dischargePortName;
        this.vesselClassId = vesselClassId;
        this.vesselClassName = vesselClassName;
        this.cargoTonnage = cargoTonnage;
        this.estimatedArrivalDate = estimatedArrivalDate;
        this.turnaroundDays = turnaroundDays;
        this.handlingDays = handlingDays;
        this.queueDays = queueDays;
        this.availableDate = availableDate;
        this.opportunityLanes = opportunityLanes;
        this.disclaimer = disclaimer;
        this.dataProvenance = dataProvenance;
    }

    public Long getDischargePortId() { return dischargePortId; }
    public void setDischargePortId(Long dischargePortId) { this.dischargePortId = dischargePortId; }

    public String getDischargePortName() { return dischargePortName; }
    public void setDischargePortName(String dischargePortName) { this.dischargePortName = dischargePortName; }

    public Long getVesselClassId() { return vesselClassId; }
    public void setVesselClassId(Long vesselClassId) { this.vesselClassId = vesselClassId; }

    public String getVesselClassName() { return vesselClassName; }
    public void setVesselClassName(String vesselClassName) { this.vesselClassName = vesselClassName; }

    public Double getCargoTonnage() { return cargoTonnage; }
    public void setCargoTonnage(Double cargoTonnage) { this.cargoTonnage = cargoTonnage; }

    public String getEstimatedArrivalDate() { return estimatedArrivalDate; }
    public void setEstimatedArrivalDate(String estimatedArrivalDate) { this.estimatedArrivalDate = estimatedArrivalDate; }

    public Double getTurnaroundDays() { return turnaroundDays; }
    public void setTurnaroundDays(Double turnaroundDays) { this.turnaroundDays = turnaroundDays; }

    public Double getHandlingDays() { return handlingDays; }
    public void setHandlingDays(Double handlingDays) { this.handlingDays = handlingDays; }

    public Double getQueueDays() { return queueDays; }
    public void setQueueDays(Double queueDays) { this.queueDays = queueDays; }

    public String getAvailableDate() { return availableDate; }
    public void setAvailableDate(String availableDate) { this.availableDate = availableDate; }

    public List<OpportunityLaneDto> getOpportunityLanes() { return opportunityLanes; }
    public void setOpportunityLanes(List<OpportunityLaneDto> opportunityLanes) { this.opportunityLanes = opportunityLanes; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    public Map<String, String> getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(Map<String, String> dataProvenance) { this.dataProvenance = dataProvenance; }
}
