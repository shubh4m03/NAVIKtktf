package com.sail.charter.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "vessel_classes")
public class VesselClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "dwt_min")
    private Double dwtMin;

    @Column(name = "dwt_max")
    private Double dwtMax;

    @Column(name = "typical_draft_m")
    private Double typicalDraftM;

    @Column(name = "typical_loa_m")
    private Double typicalLoaM;

    @Column(name = "typical_beam_m")
    private Double typicalBeamM;

    public VesselClass() {}

    public VesselClass(Long id, String name, Double dwtMin, Double dwtMax, Double typicalDraftM, Double typicalLoaM, Double typicalBeamM) {
        this.id = id;
        this.name = name;
        this.dwtMin = dwtMin;
        this.dwtMax = dwtMax;
        this.typicalDraftM = typicalDraftM;
        this.typicalLoaM = typicalLoaM;
        this.typicalBeamM = typicalBeamM;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getDwtMin() { return dwtMin; }
    public void setDwtMin(Double dwtMin) { this.dwtMin = dwtMin; }

    public Double getDwtMax() { return dwtMax; }
    public void setDwtMax(Double dwtMax) { this.dwtMax = dwtMax; }

    public Double getTypicalDraftM() { return typicalDraftM; }
    public void setTypicalDraftM(Double typicalDraftM) { this.typicalDraftM = typicalDraftM; }

    public Double getTypicalLoaM() { return typicalLoaM; }
    public void setTypicalLoaM(Double typicalLoaM) { this.typicalLoaM = typicalLoaM; }

    public Double getTypicalBeamM() { return typicalBeamM; }
    public void setTypicalBeamM(Double typicalBeamM) { this.typicalBeamM = typicalBeamM; }
}
