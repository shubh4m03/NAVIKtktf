package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "port_constraints")
public class PortConstraint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_id", nullable = false)
    private Port port;

    @Column(name = "max_draft_m")
    private Double maxDraftM;

    @Column(name = "max_loa_m")
    private Double maxLoaM;

    @Column(name = "max_beam_m")
    private Double maxBeamM;

    @Column(name = "berth_count")
    private Integer berthCount;

    @Column(name = "handling_rate_tph")
    private Double handlingRateTph;

    @Column(name = "avg_turnaround_days")
    private Double avgTurnaroundDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 50)
    private DataProvenance dataProvenance;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "last_verified_at")
    private OffsetDateTime lastVerifiedAt;

    public PortConstraint() {}

    public PortConstraint(Long id, Port port, Double maxDraftM, Double maxLoaM, Double maxBeamM,
                          Integer berthCount, Double handlingRateTph, Double avgTurnaroundDays,
                          DataProvenance dataProvenance, String sourceUrl, OffsetDateTime lastVerifiedAt) {
        this.id = id;
        this.port = port;
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

    public Port getPort() { return port; }
    public void setPort(Port port) { this.port = port; }

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
