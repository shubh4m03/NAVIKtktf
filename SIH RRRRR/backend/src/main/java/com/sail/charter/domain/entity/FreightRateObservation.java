package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "freight_rate_observations")
public class FreightRateObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "route_id")
    private Route route;

    @Column(name = "origin_region", nullable = false, length = 100)
    private String originRegion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_port_id")
    private Port destinationPort;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vessel_class_id")
    private VesselClass vesselClass;

    @Column(name = "cargo_type", nullable = false, length = 100)
    private String cargoType;

    @Column(name = "observation_date", nullable = false)
    private LocalDate observationDate;

    @Column(name = "rate_usd_per_tonne", nullable = false)
    private Double rateUsdPerTonne;

    @Column(name = "bunker_price_usd_per_tonne")
    private Double bunkerPriceUsdPerTonne;

    @Column(name = "congestion_index")
    private Double congestionIndex;

    @Column(name = "data_provenance", nullable = false, length = 50)
    private String dataProvenance;

    @Column(name = "source", length = 255)
    private String source;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public FreightRateObservation() {}

    public FreightRateObservation(Long id, Route route, String originRegion, Port destinationPort,
                                  VesselClass vesselClass, String cargoType, LocalDate observationDate,
                                  Double rateUsdPerTonne, Double bunkerPriceUsdPerTonne, Double congestionIndex,
                                  String dataProvenance, String source, OffsetDateTime createdAt) {
        this.id = id;
        this.route = route;
        this.originRegion = originRegion;
        this.destinationPort = destinationPort;
        this.vesselClass = vesselClass;
        this.cargoType = cargoType;
        this.observationDate = observationDate;
        this.rateUsdPerTonne = rateUsdPerTonne;
        this.bunkerPriceUsdPerTonne = bunkerPriceUsdPerTonne;
        this.congestionIndex = congestionIndex;
        this.dataProvenance = dataProvenance;
        this.source = source;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }

    public String getOriginRegion() { return originRegion; }
    public void setOriginRegion(String originRegion) { this.originRegion = originRegion; }

    public Port getDestinationPort() { return destinationPort; }
    public void setDestinationPort(Port destinationPort) { this.destinationPort = destinationPort; }

    public VesselClass getVesselClass() { return vesselClass; }
    public void setVesselClass(VesselClass vesselClass) { this.vesselClass = vesselClass; }

    public String getCargoType() { return cargoType; }
    public void setCargoType(String cargoType) { this.cargoType = cargoType; }

    public LocalDate getObservationDate() { return observationDate; }
    public void setObservationDate(LocalDate observationDate) { this.observationDate = observationDate; }

    public Double getRateUsdPerTonne() { return rateUsdPerTonne; }
    public void setRateUsdPerTonne(Double rateUsdPerTonne) { this.rateUsdPerTonne = rateUsdPerTonne; }

    public Double getBunkerPriceUsdPerTonne() { return bunkerPriceUsdPerTonne; }
    public void setBunkerPriceUsdPerTonne(Double bunkerPriceUsdPerTonne) { this.bunkerPriceUsdPerTonne = bunkerPriceUsdPerTonne; }

    public Double getCongestionIndex() { return congestionIndex; }
    public void setCongestionIndex(Double congestionIndex) { this.congestionIndex = congestionIndex; }

    public String getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(String dataProvenance) { this.dataProvenance = dataProvenance; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
