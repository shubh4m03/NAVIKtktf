package com.sail.charter.api.dto;

import com.sail.charter.domain.entity.DataProvenance;
import java.time.OffsetDateTime;

public class PortConstraintDto {
    private Long id;
    private Double maxDraftM;
    private Double maxLoaM;
    private Double maxBeamM;
    private Integer berthCount;
    private Double handlingRateTph;
    private Double avgTurnaroundDays;
    private DataProvenance dataProvenance;
    private String sourceUrl;
    private OffsetDateTime lastVerifiedAt;

    public PortConstraintDto() {}

    public PortConstraintDto(Long id, Double maxDraftM, Double maxLoaM, Double maxBeamM,
                             Integer berthCount, Double handlingRateTph, Double avgTurnaroundDays,
                             DataProvenance dataProvenance, String sourceUrl, OffsetDateTime lastVerifiedAt) {
        this.id = id;
        this.maxDraftM = maxDraftM;
        this.maxLoaM = maxLoaM;
        this.maxBeamM = maxBeamM;
        this.berthCount = berthCount;
        this.handlingRateTph = handlingRateTph;
        this.avgTurnaroundDays = avgTurnaroundDays;
        this.dataProvenance = dataProvenance;
        this.sourceUrl = sourceUrl;
        this.lastVerifiedAt = lastVerifiedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Double getMaxDraftM() { return maxDraftM; }
    public void setMaxDraftM(Double maxDraftM) { this.maxDraftM = maxDraftM; }

    public Double getMaxLoaM() { return maxLoaM; }
    public void setMaxLoaM(Double maxLoaM) { this.maxLoaM = maxLoaM; }

    public Double getMaxBeamM() { return maxBeamM; }
    public void setMaxBeamM(Double maxBeamM) { this.maxBeamM = maxBeamM; }

    public Integer getBerthCount() { return berthCount; }
    public void setBerthCount(Integer berthCount) { this.berthCount = berthCount; }

    public Double getHandlingRateTph() { return handlingRateTph; }
    public void setHandlingRateTph(Double handlingRateTph) { this.handlingRateTph = handlingRateTph; }

    public Double getAvgTurnaroundDays() { return avgTurnaroundDays; }
    public void setAvgTurnaroundDays(Double avgTurnaroundDays) { this.avgTurnaroundDays = avgTurnaroundDays; }

    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public OffsetDateTime getLastVerifiedAt() { return lastVerifiedAt; }
    public void setLastVerifiedAt(OffsetDateTime lastVerifiedAt) { this.lastVerifiedAt = lastVerifiedAt; }
}
