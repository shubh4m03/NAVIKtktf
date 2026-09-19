package com.sail.charter.api.dto;

public class VesselClassDto {
    private Long id;
    private String name;
    private Double dwtMin;
    private Double dwtMax;
    private Double typicalDraftM;
    private Double typicalLoaM;
    private Double typicalBeamM;

    public VesselClassDto() {}

    public VesselClassDto(Long id, String name, Double dwtMin, Double dwtMax,
                          Double typicalDraftM, Double typicalLoaM, Double typicalBeamM) {
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
