package com.sail.charter.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "vessels")
public class Vessel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vessel_class_id", nullable = false)
    private VesselClass vesselClass;

    @Column(name = "dwt")
    private Double dwt;

    @Column(name = "draft_m")
    private Double draftM;

    @Column(name = "loa_m")
    private Double loaM;

    @Column(name = "beam_m")
    private Double beamM;

    public Vessel() {}

    public Vessel(Long id, String name, VesselClass vesselClass, Double dwt, Double draftM, Double loaM, Double beamM) {
        this.id = id;
        this.name = name;
        this.vesselClass = vesselClass;
        this.dwt = dwt;
        this.draftM = draftM;
        this.loaM = loaM;
        this.beamM = beamM;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public VesselClass getVesselClass() { return vesselClass; }
    public void setVesselClass(VesselClass vesselClass) { this.vesselClass = vesselClass; }

    public Double getDwt() { return dwt; }
    public void setDwt(Double dwt) { this.dwt = dwt; }

    public Double getDraftM() { return draftM; }
    public void setDraftM(Double draftM) { this.draftM = draftM; }

    public Double getLoaM() { return loaM; }
    public void setLoaM(Double loaM) { this.loaM = loaM; }

    public Double getBeamM() { return beamM; }
    public void setBeamM(Double beamM) { this.beamM = beamM; }
}
