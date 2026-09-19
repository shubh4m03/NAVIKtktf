package com.sail.charter.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class OpportunityLaneDto {

    @JsonProperty("lane_id")
    private String laneId;

    @JsonProperty("destination_region")
    private String destinationRegion;

    @JsonProperty("destination_ports")
    private String destinationPorts;

    @JsonProperty("target_commodity")
    private String targetCommodity;

    @JsonProperty("ballast_distance_nm")
    private Double ballastDistanceNm;

    @JsonProperty("ballast_transit_days")
    private Double ballastTransitDays;

    @JsonProperty("est_repositioning_cost_usd")
    private Double estRepositioningCostUsd;

    @JsonProperty("demand_seasonality_score")
    private Double demandSeasonalityScore;

    @JsonProperty("demand_seasonality_label")
    private String demandSeasonalityLabel;

    @JsonProperty("trade_pattern_notes")
    private String tradePatternNotes;

    @JsonProperty("provenance")
    private Map<String, String> provenance;

    public OpportunityLaneDto() {}

    public OpportunityLaneDto(String laneId, String destinationRegion, String destinationPorts,
                              String targetCommodity, Double ballastDistanceNm, Double ballastTransitDays,
                              Double estRepositioningCostUsd, Double demandSeasonalityScore,
                              String demandSeasonalityLabel, String tradePatternNotes,
                              Map<String, String> provenance) {
        this.laneId = laneId;
        this.destinationRegion = destinationRegion;
        this.destinationPorts = destinationPorts;
        this.targetCommodity = targetCommodity;
        this.ballastDistanceNm = ballastDistanceNm;
        this.ballastTransitDays = ballastTransitDays;
        this.estRepositioningCostUsd = estRepositioningCostUsd;
        this.demandSeasonalityScore = demandSeasonalityScore;
        this.demandSeasonalityLabel = demandSeasonalityLabel;
        this.tradePatternNotes = tradePatternNotes;
        this.provenance = provenance;
    }

    public String getLaneId() { return laneId; }
    public void setLaneId(String laneId) { this.laneId = laneId; }

    public String getDestinationRegion() { return destinationRegion; }
    public void setDestinationRegion(String destinationRegion) { this.destinationRegion = destinationRegion; }

    public String getDestinationPorts() { return destinationPorts; }
    public void setDestinationPorts(String destinationPorts) { this.destinationPorts = destinationPorts; }

    public String getTargetCommodity() { return targetCommodity; }
    public void setTargetCommodity(String targetCommodity) { this.targetCommodity = targetCommodity; }

    public Double getBallastDistanceNm() { return ballastDistanceNm; }
    public void setBallastDistanceNm(Double ballastDistanceNm) { this.ballastDistanceNm = ballastDistanceNm; }

    public Double getBallastTransitDays() { return ballastTransitDays; }
    public void setBallastTransitDays(Double ballastTransitDays) { this.ballastTransitDays = ballastTransitDays; }

    public Double getEstRepositioningCostUsd() { return estRepositioningCostUsd; }
    public void setEstRepositioningCostUsd(Double estRepositioningCostUsd) { this.estRepositioningCostUsd = estRepositioningCostUsd; }

    public Double getDemandSeasonalityScore() { return demandSeasonalityScore; }
    public void setDemandSeasonalityScore(Double demandSeasonalityScore) { this.demandSeasonalityScore = demandSeasonalityScore; }

    public String getDemandSeasonalityLabel() { return demandSeasonalityLabel; }
    public void setDemandSeasonalityLabel(String demandSeasonalityLabel) { this.demandSeasonalityLabel = demandSeasonalityLabel; }

    public String getTradePatternNotes() { return tradePatternNotes; }
    public void setTradePatternNotes(String tradePatternNotes) { this.tradePatternNotes = tradePatternNotes; }

    public Map<String, String> getProvenance() { return provenance; }
    public void setProvenance(Map<String, String> provenance) { this.provenance = provenance; }
}
