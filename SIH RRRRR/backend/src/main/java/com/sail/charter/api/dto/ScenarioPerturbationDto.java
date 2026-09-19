package com.sail.charter.api.dto;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.HashMap;
import java.util.Map;

public class ScenarioPerturbationDto {

    @JsonProperty("freight_shock_pct")
    private Double freightShockPct;

    @JsonProperty("congestion_shock_pct")
    private Double congestionShockPct;

    @JsonProperty("bunker_shock_pct")
    private Double bunkerShockPct;

    @JsonProperty("availability_shock_pct")
    private Double availabilityShockPct;

    private Map<String, Object> additionalParameters = new HashMap<>();

    public ScenarioPerturbationDto() {}

    public ScenarioPerturbationDto(Double freightShockPct, Double congestionShockPct,
                                   Double bunkerShockPct, Double availabilityShockPct) {
        this.freightShockPct = freightShockPct;
        this.congestionShockPct = congestionShockPct;
        this.bunkerShockPct = bunkerShockPct;
        this.availabilityShockPct = availabilityShockPct;
    }

    public Double getFreightShockPct() { return freightShockPct; }
    public void setFreightShockPct(Double freightShockPct) { this.freightShockPct = freightShockPct; }

    public Double getCongestionShockPct() { return congestionShockPct; }
    public void setCongestionShockPct(Double congestionShockPct) { this.congestionShockPct = congestionShockPct; }

    public Double getBunkerShockPct() { return bunkerShockPct; }
    public void setBunkerShockPct(Double bunkerShockPct) { this.bunkerShockPct = bunkerShockPct; }

    public Double getAvailabilityShockPct() { return availabilityShockPct; }
    public void setAvailabilityShockPct(Double availabilityShockPct) { this.availabilityShockPct = availabilityShockPct; }

    @JsonAnyGetter
    public Map<String, Object> getAdditionalParameters() { return additionalParameters; }

    @JsonAnySetter
    public void setAdditionalParameter(String key, Object value) {
        if (this.additionalParameters == null) {
            this.additionalParameters = new HashMap<>();
        }
        this.additionalParameters.put(key, value);
    }
}
