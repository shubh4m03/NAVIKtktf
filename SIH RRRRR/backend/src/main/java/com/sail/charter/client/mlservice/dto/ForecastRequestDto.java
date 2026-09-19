package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ForecastRequestDto {
    @JsonProperty("origin_region")
    private String originRegion;

    @JsonProperty("destination_port")
    private String destinationPort;

    @JsonProperty("vessel_class")
    private String vesselClass;

    @JsonProperty("horizon_days")
    private Integer horizonDays;

    @JsonProperty("as_of_date")
    private String asOfDate;

    public ForecastRequestDto() {}

    public ForecastRequestDto(String originRegion, String destinationPort, String vesselClass, Integer horizonDays, String asOfDate) {
        this.originRegion = originRegion;
        this.destinationPort = destinationPort;
        this.vesselClass = vesselClass;
        this.horizonDays = horizonDays;
        this.asOfDate = asOfDate;
    }

    public String getOriginRegion() { return originRegion; }
    public void setOriginRegion(String originRegion) { this.originRegion = originRegion; }

    public String getDestinationPort() { return destinationPort; }
    public void setDestinationPort(String destinationPort) { this.destinationPort = destinationPort; }

    public String getVesselClass() { return vesselClass; }
    public void setVesselClass(String vesselClass) { this.vesselClass = vesselClass; }

    public Integer getHorizonDays() { return horizonDays; }
    public void setHorizonDays(Integer horizonDays) { this.horizonDays = horizonDays; }

    public String getAsOfDate() { return asOfDate; }
    public void setAsOfDate(String asOfDate) { this.asOfDate = asOfDate; }
}
