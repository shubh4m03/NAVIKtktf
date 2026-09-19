package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "voyages")
public class Voyage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vessel_id", nullable = false)
    private Vessel vessel;

    @Column(name = "eta_estimate")
    private OffsetDateTime etaEstimate;

    @Column(name = "eta_actual")
    private OffsetDateTime etaActual;

    @Column(name = "demurrage_actual")
    private Double demurrageActual;

    @Column(nullable = false, length = 50)
    private String status;

    public Voyage() {}

    public Voyage(Long id, Contract contract, Vessel vessel, OffsetDateTime etaEstimate,
                  OffsetDateTime etaActual, Double demurrageActual, String status) {
        this.id = id;
        this.contract = contract;
        this.vessel = vessel;
        this.etaEstimate = etaEstimate;
        this.etaActual = etaActual;
        this.demurrageActual = demurrageActual;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Contract getContract() { return contract; }
    public void setContract(Contract contract) { this.contract = contract; }

    public Vessel getVessel() { return vessel; }
    public void setVessel(Vessel vessel) { this.vessel = vessel; }

    public OffsetDateTime getEtaEstimate() { return etaEstimate; }
    public void setEtaEstimate(OffsetDateTime etaEstimate) { this.etaEstimate = etaEstimate; }

    public OffsetDateTime getEtaActual() { return etaActual; }
    public void setEtaActual(OffsetDateTime etaActual) { this.etaActual = etaActual; }

    public Double getDemurrageActual() { return demurrageActual; }
    public void setDemurrageActual(Double demurrageActual) { this.demurrageActual = demurrageActual; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
