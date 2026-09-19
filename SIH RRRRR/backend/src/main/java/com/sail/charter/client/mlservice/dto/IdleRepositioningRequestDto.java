package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class IdleRepositioningRequestDto {

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

    @JsonProperty("avg_turnaround_days")
    private Double avgTurnaroundDays;

    @JsonProperty("handling_rate_tph")
    private Double handlingRateTph;

    @JsonProperty("congestion_ratio")
    private Double congestionRatio;

    public IdleRepositioningRequestDto() {}

    public IdleRepositioningRequestDto(Long dischargePortId, String dischargePortName,
                                       Long vesselClassId, String vesselClassName,
                                       Double cargoTonnage, String estimatedArrivalDate,
                                       Double avgTurnaroundDays, Double handlingRateTph,
                                       Double congestionRatio) {
        this.dischargePortId = dischargePortId;
        this.dischargePortName = dischargePortName;
        this.vesselClassId = vesselClassId;
        this.vesselClassName = vesselClassName;
        this.cargoTonnage = cargoTonnage;
        this.estimatedArrivalDate = estimatedArrivalDate;
        this.avgTurnaroundDays = avgTurnaroundDays;
        this.handlingRateTph = handlingRateTph;
        this.congestionRatio = congestionRatio;
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

    public Double getAvgTurnaroundDays() { return avgTurnaroundDays; }
    public void setAvgTurnaroundDays(Double avgTurnaroundDays) { this.avgTurnaroundDays = avgTurnaroundDays; }

    public Double getHandlingRateTph() { return handlingRateTph; }
    public void setHandlingRateTph(Double handlingRateTph) { this.handlingRateTph = handlingRateTph; }

    public Double getCongestionRatio() { return congestionRatio; }
    public void setCongestionRatio(Double congestionRatio) { this.congestionRatio = congestionRatio; }
}
