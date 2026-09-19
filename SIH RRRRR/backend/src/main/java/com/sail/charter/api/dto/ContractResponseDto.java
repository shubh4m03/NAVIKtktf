package com.sail.charter.api.dto;

import java.time.OffsetDateTime;

public class ContractResponseDto {

    private Long id;
    private Long cargoRequestId;
    private String contractType;
    private Double tonnage;
    private Double fixedRate;
    private OffsetDateTime fixedAt;
    private String status;

    public ContractResponseDto() {}

    public ContractResponseDto(Long id, Long cargoRequestId, String contractType, Double tonnage, Double fixedRate, OffsetDateTime fixedAt, String status) {
        this.id = id;
        this.cargoRequestId = cargoRequestId;
        this.contractType = contractType;
        this.tonnage = tonnage;
        this.fixedRate = fixedRate;
        this.fixedAt = fixedAt;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCargoRequestId() { return cargoRequestId; }
    public void setCargoRequestId(Long cargoRequestId) { this.cargoRequestId = cargoRequestId; }

    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }

    public Double getTonnage() { return tonnage; }
    public void setTonnage(Double tonnage) { this.tonnage = tonnage; }

    public Double getFixedRate() { return fixedRate; }
    public void setFixedRate(Double fixedRate) { this.fixedRate = fixedRate; }

    public OffsetDateTime getFixedAt() { return fixedAt; }
    public void setFixedAt(OffsetDateTime fixedAt) { this.fixedAt = fixedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
