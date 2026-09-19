package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class VesselRankResponseDto {
    @JsonProperty("rankings")
    private List<VesselRankItemDto> rankings;

    public VesselRankResponseDto() {}

    public VesselRankResponseDto(List<VesselRankItemDto> rankings) {
        this.rankings = rankings;
    }

    public List<VesselRankItemDto> getRankings() { return rankings; }
    public void setRankings(List<VesselRankItemDto> rankings) { this.rankings = rankings; }

    public static class VesselRankItemDto {
        @JsonProperty("vessel_class_id")
        private Long vesselClassId;

        @JsonProperty("vessel_class_name")
        private String vesselClassName;

        @JsonProperty("score")
        private Double score;

        @JsonProperty("rank")
        private Integer rank;

        @JsonProperty("feasible")
        private Boolean feasible;

        @JsonProperty("infeasibility_reason")
        private String infeasibilityReason;

        @JsonProperty("estimated_landed_cost")
        private Double estimatedLandedCost;

        @JsonProperty("expected_delay_days")
        private Double expectedDelayDays;

        public VesselRankItemDto() {}

        public VesselRankItemDto(Long vesselClassId, String vesselClassName, Double score, Integer rank,
                                 Boolean feasible, String infeasibilityReason, Double estimatedLandedCost, Double expectedDelayDays) {
            this.vesselClassId = vesselClassId;
            this.vesselClassName = vesselClassName;
            this.score = score;
            this.rank = rank;
            this.feasible = feasible;
            this.infeasibilityReason = infeasibilityReason;
            this.estimatedLandedCost = estimatedLandedCost;
            this.expectedDelayDays = expectedDelayDays;
        }

        public Long getVesselClassId() { return vesselClassId; }
        public void setVesselClassId(Long vesselClassId) { this.vesselClassId = vesselClassId; }

        public String getVesselClassName() { return vesselClassName; }
        public void setVesselClassName(String vesselClassName) { this.vesselClassName = vesselClassName; }

        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }

        public Integer getRank() { return rank; }
        public void setRank(Integer rank) { this.rank = rank; }

        public Boolean getFeasible() { return feasible; }
        public void setFeasible(Boolean feasible) { this.feasible = feasible; }

        public String getInfeasibilityReason() { return infeasibilityReason; }
        public void setInfeasibilityReason(String infeasibilityReason) { this.infeasibilityReason = infeasibilityReason; }

        public Double getEstimatedLandedCost() { return estimatedLandedCost; }
        public void setEstimatedLandedCost(Double estimatedLandedCost) { this.estimatedLandedCost = estimatedLandedCost; }

        public Double getExpectedDelayDays() { return expectedDelayDays; }
        public void setExpectedDelayDays(Double expectedDelayDays) { this.expectedDelayDays = expectedDelayDays; }
    }
}
