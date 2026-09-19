package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class RiskScoreResponseDto {
    @JsonProperty("cargo_request_id")
    private Long cargoRequestId;

    @JsonProperty("risk_score")
    private Double riskScore;

    @JsonProperty("category")
    private String category;

    @JsonProperty("weights_used")
    private Map<String, Double> weightsUsed;

    @JsonProperty("top_drivers")
    private List<RiskDriverDto> topDrivers;

    @JsonProperty("all_drivers")
    private List<RiskDriverDto> allDrivers;

    @JsonProperty("mitigation_suggestion")
    private String mitigationSuggestion;

    @JsonProperty("split_pct_used")
    private Double splitPctUsed;

    public RiskScoreResponseDto() {}

    public RiskScoreResponseDto(Long cargoRequestId, Double riskScore, String category, Map<String, Double> weightsUsed,
                                List<RiskDriverDto> topDrivers, List<RiskDriverDto> allDrivers,
                                String mitigationSuggestion, Double splitPctUsed) {
        this.cargoRequestId = cargoRequestId;
        this.riskScore = riskScore;
        this.category = category;
        this.weightsUsed = weightsUsed;
        this.topDrivers = topDrivers;
        this.allDrivers = allDrivers;
        this.mitigationSuggestion = mitigationSuggestion;
        this.splitPctUsed = splitPctUsed;
    }

    public Long getCargoRequestId() { return cargoRequestId; }
    public void setCargoRequestId(Long cargoRequestId) { this.cargoRequestId = cargoRequestId; }

    public Double getRiskScore() { return riskScore; }
    public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Map<String, Double> getWeightsUsed() { return weightsUsed; }
    public void setWeightsUsed(Map<String, Double> weightsUsed) { this.weightsUsed = weightsUsed; }

    public List<RiskDriverDto> getTopDrivers() { return topDrivers; }
    public void setTopDrivers(List<RiskDriverDto> topDrivers) { this.topDrivers = topDrivers; }

    public List<RiskDriverDto> getAllDrivers() { return allDrivers; }
    public void setAllDrivers(List<RiskDriverDto> allDrivers) { this.allDrivers = allDrivers; }

    public String getMitigationSuggestion() { return mitigationSuggestion; }
    public void setMitigationSuggestion(String mitigationSuggestion) { this.mitigationSuggestion = mitigationSuggestion; }

    public Double getSplitPctUsed() { return splitPctUsed; }
    public void setSplitPctUsed(Double splitPctUsed) { this.splitPctUsed = splitPctUsed; }

    public static class RiskDriverDto {
        @JsonProperty("factor")
        private String factor;

        @JsonProperty("display_name")
        private String displayName;

        @JsonProperty("sub_score")
        private Double subScore;

        @JsonProperty("weight")
        private Double weight;

        @JsonProperty("weighted_contribution")
        private Double weightedContribution;

        @JsonProperty("direction")
        private String direction;

        @JsonProperty("provenance")
        private String provenance;

        @JsonProperty("source")
        private String source;

        @JsonProperty("detail")
        private String detail;

        public RiskDriverDto() {}

        public RiskDriverDto(String factor, String displayName, Double subScore, Double weight,
                             Double weightedContribution, String direction, String provenance, String source, String detail) {
            this.factor = factor;
            this.displayName = displayName;
            this.subScore = subScore;
            this.weight = weight;
            this.weightedContribution = weightedContribution;
            this.direction = direction;
            this.provenance = provenance;
            this.source = source;
            this.detail = detail;
        }

        public String getFactor() { return factor; }
        public void setFactor(String factor) { this.factor = factor; }

        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }

        public Double getSubScore() { return subScore; }
        public void setSubScore(Double subScore) { this.subScore = subScore; }

        public Double getWeight() { return weight; }
        public void setWeight(Double weight) { this.weight = weight; }

        public Double getWeightedContribution() { return weightedContribution; }
        public void setWeightedContribution(Double weightedContribution) { this.weightedContribution = weightedContribution; }

        public String getDirection() { return direction; }
        public void setDirection(String direction) { this.direction = direction; }

        public String getProvenance() { return provenance; }
        public void setProvenance(String provenance) { this.provenance = provenance; }

        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }

        public String getDetail() { return detail; }
        public void setDetail(String detail) { this.detail = detail; }
    }
}
