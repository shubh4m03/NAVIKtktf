package com.sail.charter.api.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public class CargoRequestResponseDto {
    private Long id;
    private Long userId;
    private Double tonnage;
    private String originRegion;
    private Long destinationPortId;
    private String destinationPortName;
    private LocalDate deadline;
    private String contractPreference;
    private OffsetDateTime createdAt;
    private String status;

    public CargoRequestResponseDto() {}

    public CargoRequestResponseDto(Long id, Long userId, Double tonnage, String originRegion,
                                   Long destinationPortId, String destinationPortName,
                                   LocalDate deadline, String contractPreference,
                                   OffsetDateTime createdAt, String status) {
        this.id = id;
        this.userId = userId;
        this.tonnage = tonnage;
        this.originRegion = originRegion;
        this.destinationPortId = destinationPortId;
        this.destinationPortName = destinationPortName;
        this.deadline = deadline;
        this.contractPreference = contractPreference;
        this.createdAt = createdAt;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Double getTonnage() { return tonnage; }
    public void setTonnage(Double tonnage) { this.tonnage = tonnage; }

    public String getOriginRegion() { return originRegion; }
    public void setOriginRegion(String originRegion) { this.originRegion = originRegion; }

    public Long getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(Long destinationPortId) { this.destinationPortId = destinationPortId; }

    public String getDestinationPortName() { return destinationPortName; }
    public void setDestinationPortName(String destinationPortName) { this.destinationPortName = destinationPortName; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public String getContractPreference() { return contractPreference; }
    public void setContractPreference(String contractPreference) { this.contractPreference = contractPreference; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
