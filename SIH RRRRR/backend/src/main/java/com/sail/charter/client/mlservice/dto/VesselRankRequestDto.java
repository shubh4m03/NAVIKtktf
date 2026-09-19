package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class VesselRankRequestDto {
    @JsonProperty("port_id")
    private Long portId;

    @JsonProperty("max_draft_m")
    private Double maxDraftM;

    @JsonProperty("max_loa_m")
    private Double maxLoaM;

    @JsonProperty("max_beam_m")
    private Double maxBeamM;

    @JsonProperty("cargo_quantity_mt")
    private Double cargoQuantityMt;

    @JsonProperty("candidates")
    private List<VesselCandidateItemDto> candidates;

    @JsonProperty("weights_preset")
    private String weightsPreset;

    public VesselRankRequestDto() {}

    public VesselRankRequestDto(Long portId, Double maxDraftM, Double maxLoaM, Double maxBeamM,
                                Double cargoQuantityMt, List<VesselCandidateItemDto> candidates, String weightsPreset) {
        this.portId = portId;
        this.maxDraftM = maxDraftM;
        this.maxLoaM = maxLoaM;
        this.maxBeamM = maxBeamM;
        this.cargoQuantityMt = cargoQuantityMt;
        this.candidates = candidates;
        this.weightsPreset = weightsPreset;
    }

    public Long getPortId() { return portId; }
    public void setPortId(Long portId) { this.portId = portId; }

    public Double getMaxDraftM() { return maxDraftM; }
    public void setMaxDraftM(Double maxDraftM) { this.maxDraftM = maxDraftM; }

    public Double getMaxLoaM() { return maxLoaM; }
    public void setMaxLoaM(Double maxLoaM) { this.maxLoaM = maxLoaM; }

    public Double getMaxBeamM() { return maxBeamM; }
    public void setMaxBeamM(Double maxBeamM) { this.maxBeamM = maxBeamM; }

    public Double getCargoQuantityMt() { return cargoQuantityMt; }
    public void setCargoQuantityMt(Double cargoQuantityMt) { this.cargoQuantityMt = cargoQuantityMt; }

    public List<VesselCandidateItemDto> getCandidates() { return candidates; }
    public void setCandidates(List<VesselCandidateItemDto> candidates) { this.candidates = candidates; }

    public String getWeightsPreset() { return weightsPreset; }
    public void setWeightsPreset(String weightsPreset) { this.weightsPreset = weightsPreset; }

    public static class VesselCandidateItemDto {
        @JsonProperty("vessel_class_id")
        private Long vesselClassId;

        @JsonProperty("vessel_class_name")
        private String vesselClassName;

        @JsonProperty("draft_m")
        private Double draftM;

        @JsonProperty("loa_m")
        private Double loaM;

        @JsonProperty("beam_m")
        private Double beamM;

        @JsonProperty("dwt")
        private Double dwt;

        @JsonProperty("estimated_landed_cost")
        private Double estimatedLandedCost;

        @JsonProperty("expected_delay_days")
        private Double expectedDelayDays;

        @JsonProperty("availability_score")
        private Double availabilityScore;

        @JsonProperty("risk_penalty")
        private Double riskPenalty;

        public VesselCandidateItemDto() {}

        public VesselCandidateItemDto(Long vesselClassId, String vesselClassName, Double draftM, Double loaM,
                                      Double beamM, Double dwt, Double estimatedLandedCost, Double expectedDelayDays,
                                      Double availabilityScore, Double riskPenalty) {
            this.vesselClassId = vesselClassId;
            this.vesselClassName = vesselClassName;
            this.draftM = draftM;
            this.loaM = loaM;
            this.beamM = beamM;
            this.dwt = dwt;
            this.estimatedLandedCost = estimatedLandedCost;
            this.expectedDelayDays = expectedDelayDays;
            this.availabilityScore = availabilityScore;
            this.riskPenalty = riskPenalty;
        }

        public Long getVesselClassId() { return vesselClassId; }
        public void setVesselClassId(Long vesselClassId) { this.vesselClassId = vesselClassId; }

        public String getVesselClassName() { return vesselClassName; }
        public void setVesselClassName(String vesselClassName) { this.vesselClassName = vesselClassName; }

        public Double getDraftM() { return draftM; }
        public void setDraftM(Double draftM) { this.draftM = draftM; }

        public Double getLoaM() { return loaM; }
        public void setLoaM(Double loaM) { this.loaM = loaM; }

        public Double getBeamM() { return beamM; }
        public void setBeamM(Double beamM) { this.beamM = beamM; }

        public Double getDwt() { return dwt; }
        public void setDwt(Double dwt) { this.dwt = dwt; }

        public Double getEstimatedLandedCost() { return estimatedLandedCost; }
        public void setEstimatedLandedCost(Double estimatedLandedCost) { this.estimatedLandedCost = estimatedLandedCost; }

        public Double getExpectedDelayDays() { return expectedDelayDays; }
        public void setExpectedDelayDays(Double expectedDelayDays) { this.expectedDelayDays = expectedDelayDays; }

        public Double getAvailabilityScore() { return availabilityScore; }
        public void setAvailabilityScore(Double availabilityScore) { this.availabilityScore = availabilityScore; }

        public Double getRiskPenalty() { return riskPenalty; }
        public void setRiskPenalty(Double riskPenalty) { this.riskPenalty = riskPenalty; }
    }
}
