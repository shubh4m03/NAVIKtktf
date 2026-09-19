package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class EntryTimingRequestDto {
    @JsonProperty("cargo_quantity_mt")
    private Double cargoQuantityMt;

    @JsonProperty("current_spot_rate")
    private Double currentSpotRate;

    @JsonProperty("forecast_expected_rate")
    private Double forecastExpectedRate;

    @JsonProperty("forecast_spread")
    private Double forecastSpread;

    @JsonProperty("deadline_days")
    private Double deadlineDays;

    @JsonProperty("transit_days")
    private Double transitDays;

    @JsonProperty("port_queue_days")
    private Double portQueueDays;

    @JsonProperty("wait_days")
    private Double waitDays;

    @JsonProperty("risk_aversion_lambda")
    private Double riskAversionLambda;

    public EntryTimingRequestDto() {}

    public EntryTimingRequestDto(Double cargoQuantityMt, Double currentSpotRate, Double forecastExpectedRate,
                                 Double forecastSpread, Double deadlineDays, Double transitDays,
                                 Double portQueueDays, Double waitDays, Double riskAversionLambda) {
        this.cargoQuantityMt = cargoQuantityMt;
        this.currentSpotRate = currentSpotRate;
        this.forecastExpectedRate = forecastExpectedRate;
        this.forecastSpread = forecastSpread;
        this.deadlineDays = deadlineDays;
        this.transitDays = transitDays;
        this.portQueueDays = portQueueDays;
        this.waitDays = waitDays;
        this.riskAversionLambda = riskAversionLambda;
    }

    public Double getCargoQuantityMt() { return cargoQuantityMt; }
    public void setCargoQuantityMt(Double cargoQuantityMt) { this.cargoQuantityMt = cargoQuantityMt; }

    public Double getCurrentSpotRate() { return currentSpotRate; }
    public void setCurrentSpotRate(Double currentSpotRate) { this.currentSpotRate = currentSpotRate; }

    public Double getForecastExpectedRate() { return forecastExpectedRate; }
    public void setForecastExpectedRate(Double forecastExpectedRate) { this.forecastExpectedRate = forecastExpectedRate; }

    public Double getForecastSpread() { return forecastSpread; }
    public void setForecastSpread(Double forecastSpread) { this.forecastSpread = forecastSpread; }

    public Double getDeadlineDays() { return deadlineDays; }
    public void setDeadlineDays(Double deadlineDays) { this.deadlineDays = deadlineDays; }

    public Double getTransitDays() { return transitDays; }
    public void setTransitDays(Double transitDays) { this.transitDays = transitDays; }

    public Double getPortQueueDays() { return portQueueDays; }
    public void setPortQueueDays(Double portQueueDays) { this.portQueueDays = portQueueDays; }

    public Double getWaitDays() { return waitDays; }
    public void setWaitDays(Double waitDays) { this.waitDays = waitDays; }

    public Double getRiskAversionLambda() { return riskAversionLambda; }
    public void setRiskAversionLambda(Double riskAversionLambda) { this.riskAversionLambda = riskAversionLambda; }
}
