package com.sail.charter.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.OffsetDateTime;

public class CreateContractDto {

    @NotNull(message = "cargoRequestId is required")
    private Long cargoRequestId;

    @NotNull(message = "contractType is required (spot, short_term, medium_term)")
    private String contractType;

    @NotNull(message = "tonnage is required")
    @Positive(message = "tonnage must be positive")
    private Double tonnage;

    @NotNull(message = "fixedRate is required")
    @Positive(message = "fixedRate must be positive")
    private Double fixedRate;

    public CreateContractDto() {}

    public CreateContractDto(Long cargoRequestId, String contractType, Double tonnage, Double fixedRate) {
        this.cargoRequestId = cargoRequestId;
        this.contractType = contractType;
        this.tonnage = tonnage;
        this.fixedRate = fixedRate;
    }

    public Long getCargoRequestId() { return cargoRequestId; }
    public void setCargoRequestId(Long cargoRequestId) { this.cargoRequestId = cargoRequestId; }

    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }

    public Double getTonnage() { return tonnage; }
    public void setTonnage(Double tonnage) { this.tonnage = tonnage; }

    public Double getFixedRate() { return fixedRate; }
    public void setFixedRate(Double fixedRate) { this.fixedRate = fixedRate; }
}
