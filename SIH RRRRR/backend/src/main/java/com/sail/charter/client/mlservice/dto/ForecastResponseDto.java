package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class ForecastResponseDto {
    @JsonProperty("expected_value_usd_per_ton")
    private Double expectedValueUsdPerTon;

    @JsonProperty("interval_50")
    private List<Double> interval50;

    @JsonProperty("interval_90")
    private List<Double> interval90;

    @JsonProperty("prob_increase_gt_8pct")
    private Double probIncreaseGt8Pct;

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    @JsonProperty("model_used")
    private String modelUsed;

    @JsonProperty("data_provenance")
    private Map<String, String> dataProvenance;

    @JsonProperty("generated_at")
    private String generatedAt;

    public ForecastResponseDto() {}

    public ForecastResponseDto(Double expectedValueUsdPerTon, List<Double> interval50, List<Double> interval90,
                               Double probIncreaseGt8Pct, Double confidenceScore, String modelUsed,
                               Map<String, String> dataProvenance, String generatedAt) {
        this.expectedValueUsdPerTon = expectedValueUsdPerTon;
        this.interval50 = interval50;
        this.interval90 = interval90;
        this.probIncreaseGt8Pct = probIncreaseGt8Pct;
        this.confidenceScore = confidenceScore;
        this.modelUsed = modelUsed;
        this.dataProvenance = dataProvenance;
        this.generatedAt = generatedAt;
    }

    public Double getExpectedValueUsdPerTon() { return expectedValueUsdPerTon; }
    public void setExpectedValueUsdPerTon(Double expectedValueUsdPerTon) { this.expectedValueUsdPerTon = expectedValueUsdPerTon; }

    public List<Double> getInterval50() { return interval50; }
    public void setInterval50(List<Double> interval50) { this.interval50 = interval50; }

    public List<Double> getInterval90() { return interval90; }
    public void setInterval90(List<Double> interval90) { this.interval90 = interval90; }

    public Double getProbIncreaseGt8Pct() { return probIncreaseGt8Pct; }
    public void setProbIncreaseGt8Pct(Double probIncreaseGt8Pct) { this.probIncreaseGt8Pct = probIncreaseGt8Pct; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }

    public Map<String, String> getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(Map<String, String> dataProvenance) { this.dataProvenance = dataProvenance; }

    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
}
