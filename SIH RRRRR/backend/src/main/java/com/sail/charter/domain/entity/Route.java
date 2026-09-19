package com.sail.charter.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "routes")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "origin_region", nullable = false, length = 100)
    private String originRegion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_port_id", nullable = false)
    private Port destinationPort;

    @Column(name = "distance_nm", nullable = false)
    private Double distanceNm;

    @Column(name = "typical_transit_days", nullable = false)
    private Double typicalTransitDays;

    public Route() {}

    public Route(Long id, String originRegion, Port destinationPort, Double distanceNm, Double typicalTransitDays) {
        this.id = id;
        this.originRegion = originRegion;
        this.destinationPort = destinationPort;
        this.distanceNm = distanceNm;
        this.typicalTransitDays = typicalTransitDays;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOriginRegion() { return originRegion; }
    public void setOriginRegion(String originRegion) { this.originRegion = originRegion; }

    public Port getDestinationPort() { return destinationPort; }
    public void setDestinationPort(Port destinationPort) { this.destinationPort = destinationPort; }

    public Double getDistanceNm() { return distanceNm; }
    public void setDistanceNm(Double distanceNm) { this.distanceNm = distanceNm; }

    public Double getTypicalTransitDays() { return typicalTransitDays; }
    public void setTypicalTransitDays(Double typicalTransitDays) { this.typicalTransitDays = typicalTransitDays; }
}
