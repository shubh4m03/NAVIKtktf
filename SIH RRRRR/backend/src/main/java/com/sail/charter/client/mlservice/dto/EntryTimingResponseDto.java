package com.sail.charter.client.mlservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class EntryTimingResponseDto {
    @JsonProperty("recommended_action")
    private String recommendedAction;

    @JsonProperty("split_pct")
    private Double splitPct;

    @JsonProperty("optimal_p")
    private Double optimalP;

    @JsonProperty("etlc_now")
    private Double etlcNow;

    @JsonProperty("etlc_wait")
    private Double etlcWait;

    @JsonProperty("optimal_etlc")
    private Double optimalEtlc;

    @JsonProperty("is_wait_feasible")
    private Boolean isWaitFeasible;

    @JsonProperty("time_buffer_days")
    private Double timeBufferDays;

    @JsonProperty("rationale")
    private Map<String, Object> rationale;

    public EntryTimingResponseDto() {}

    public EntryTimingResponseDto(String recommendedAction, Double splitPct, Double optimalP,
                                  Double etlcNow, Double etlcWait, Double optimalEtlc,
                                  Boolean isWaitFeasible, Double timeBufferDays, Map<String, Object> rationale) {
        this.recommendedAction = recommendedAction;
        this.splitPct = splitPct;
        this.optimalP = optimalP;
        this.etlcNow = etlcNow;
        this.etlcWait = etlcWait;
        this.optimalEtlc = optimalEtlc;
        this.isWaitFeasible = isWaitFeasible;
        this.timeBufferDays = timeBufferDays;
        this.rationale = rationale;
    }

    public String getRecommendedAction() { return recommendedAction; }
    public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }

    public Double getSplitPct() { return splitPct; }
    public void setSplitPct(Double splitPct) { this.splitPct = splitPct; }

    public Double getOptimalP() { return optimalP; }
    public void setOptimalP(Double optimalP) { this.optimalP = optimalP; }

    public Double getEtlcNow() { return etlcNow; }
    public void setEtlcNow(Double etlcNow) { this.etlcNow = etlcNow; }

    public Double getEtlcWait() { return etlcWait; }
    public void setEtlcWait(Double etlcWait) { this.etlcWait = etlcWait; }

    public Double getOptimalEtlc() { return optimalEtlc; }
    public void setOptimalEtlc(Double optimalEtlc) { this.optimalEtlc = optimalEtlc; }

    public Boolean getIsWaitFeasible() { return isWaitFeasible; }
    public void setIsWaitFeasible(Boolean isWaitFeasible) { this.isWaitFeasible = isWaitFeasible; }

    public Double getTimeBufferDays() { return timeBufferDays; }
    public void setTimeBufferDays(Double timeBufferDays) { this.timeBufferDays = timeBufferDays; }

    public Map<String, Object> getRationale() { return rationale; }
    public void setRationale(Map<String, Object> rationale) { this.rationale = rationale; }
}
