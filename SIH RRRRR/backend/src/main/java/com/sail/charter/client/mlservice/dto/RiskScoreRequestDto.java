package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RiskScoreRequestDto {
    @JsonProperty("cargo_request_id")
    private Long cargoRequestId;

    @JsonProperty("volatility_sub_score")
    private Double volatilitySubScore;

    @JsonProperty("congestion_sub_score")
    private Double congestionSubScore;

    @JsonProperty("weather_sub_score")
    private Double weatherSubScore;

    @JsonProperty("availability_sub_score")
    private Double availabilitySubScore;

    @JsonProperty("shock_sub_score")
    private Double shockSubScore;

    @JsonProperty("forecast_relative_spread")
    private Double forecastRelativeSpread;

    @JsonProperty("port_waiting_days")
    private Double portWaitingDays;

    @JsonProperty("destination_region")
    private String destinationRegion;

    @JsonProperty("laycan_month")
    private Integer laycanMonth;

    @JsonProperty("freight_momentum_pct")
    private Double freightMomentumPct;

    @JsonProperty("commodity_shock_pct")
    private Double commodityShockPct;

    @JsonProperty("split_pct")
    private Double splitPct;

    public RiskScoreRequestDto() {}

    public RiskScoreRequestDto(Long cargoRequestId, Double volatilitySubScore, Double congestionSubScore,
                               Double weatherSubScore, Double availabilitySubScore, Double shockSubScore,
                               Double forecastRelativeSpread, Double portWaitingDays, String destinationRegion,
                               Integer laycanMonth, Double freightMomentumPct, Double commodityShockPct, Double splitPct) {
        this.cargoRequestId = cargoRequestId;
        this.volatilitySubScore = volatilitySubScore;
        this.congestionSubScore = congestionSubScore;
        this.weatherSubScore = weatherSubScore;
        this.availabilitySubScore = availabilitySubScore;
        this.shockSubScore = shockSubScore;
        this.forecastRelativeSpread = forecastRelativeSpread;
        this.portWaitingDays = portWaitingDays;
        this.destinationRegion = destinationRegion;
        this.laycanMonth = laycanMonth;
        this.freightMomentumPct = freightMomentumPct;
        this.commodityShockPct = commodityShockPct;
        this.splitPct = splitPct;
    }

    public Long getCargoRequestId() { return cargoRequestId; }
    public void setCargoRequestId(Long cargoRequestId) { this.cargoRequestId = cargoRequestId; }

    public Double getVolatilitySubScore() { return volatilitySubScore; }
    public void setVolatilitySubScore(Double volatilitySubScore) { this.volatilitySubScore = volatilitySubScore; }

    public Double getCongestionSubScore() { return congestionSubScore; }
    public void setCongestionSubScore(Double congestionSubScore) { this.congestionSubScore = congestionSubScore; }

    public Double getWeatherSubScore() { return weatherSubScore; }
    public void setWeatherSubScore(Double weatherSubScore) { this.weatherSubScore = weatherSubScore; }

    public Double getAvailabilitySubScore() { return availabilitySubScore; }
    public void setAvailabilitySubScore(Double availabilitySubScore) { this.availabilitySubScore = availabilitySubScore; }

    public Double getShockSubScore() { return shockSubScore; }
    public void setShockSubScore(Double shockSubScore) { this.shockSubScore = shockSubScore; }

    public Double getForecastRelativeSpread() { return forecastRelativeSpread; }
    public void setForecastRelativeSpread(Double forecastRelativeSpread) { this.forecastRelativeSpread = forecastRelativeSpread; }

    public Double getPortWaitingDays() { return portWaitingDays; }
    public void setPortWaitingDays(Double portWaitingDays) { this.portWaitingDays = portWaitingDays; }

    public String getDestinationRegion() { return destinationRegion; }
    public void setDestinationRegion(String destinationRegion) { this.destinationRegion = destinationRegion; }

    public Integer getLaycanMonth() { return laycanMonth; }
    public void setLaycanMonth(Integer laycanMonth) { this.laycanMonth = laycanMonth; }

    public Double getFreightMomentumPct() { return freightMomentumPct; }
    public void setFreightMomentumPct(Double freightMomentumPct) { this.freightMomentumPct = freightMomentumPct; }

    public Double getCommodityShockPct() { return commodityShockPct; }
    public void setCommodityShockPct(Double commodityShockPct) { this.commodityShockPct = commodityShockPct; }

    public Double getSplitPct() { return splitPct; }
    public void setSplitPct(Double splitPct) { this.splitPct = splitPct; }
}
