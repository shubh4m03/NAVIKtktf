package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cargo_request_id")
    private CargoRequest cargoRequest;

    @Convert(converter = ContractTypeConverter.class)
    @Column(name = "contract_type", nullable = false, length = 20)
    private ContractType contractType;

    @Column(nullable = false)
    private Double tonnage;

    @Column(name = "fixed_rate", nullable = false)
    private Double fixedRate;

    @Column(name = "fixed_at")
    private OffsetDateTime fixedAt = OffsetDateTime.now();

    @Column(nullable = false, length = 50)
    private String status;

    public Contract() {}

    public Contract(Long id, CargoRequest cargoRequest, ContractType contractType, Double tonnage,
                    Double fixedRate, OffsetDateTime fixedAt, String status) {
        this.id = id;
        this.cargoRequest = cargoRequest;
        this.contractType = contractType;
        this.tonnage = tonnage;
        this.fixedRate = fixedRate;
        this.fixedAt = fixedAt != null ? fixedAt : OffsetDateTime.now();
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CargoRequest getCargoRequest() { return cargoRequest; }
    public void setCargoRequest(CargoRequest cargoRequest) { this.cargoRequest = cargoRequest; }

    public ContractType getContractType() { return contractType; }
    public void setContractType(ContractType contractType) { this.contractType = contractType; }

    public Double getTonnage() { return tonnage; }
    public void setTonnage(Double tonnage) { this.tonnage = tonnage; }

    public Double getFixedRate() { return fixedRate; }
    public void setFixedRate(Double fixedRate) { this.fixedRate = fixedRate; }

    public OffsetDateTime getFixedAt() { return fixedAt; }
    public void setFixedAt(OffsetDateTime fixedAt) { this.fixedAt = fixedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
