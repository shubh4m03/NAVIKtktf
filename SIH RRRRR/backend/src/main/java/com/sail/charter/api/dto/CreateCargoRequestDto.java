package com.sail.charter.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

public class CreateCargoRequestDto {

    private Long userId;

    @NotNull(message = "Tonnage is required")
    @Positive(message = "Tonnage must be positive")
    private Double tonnage;

    @NotBlank(message = "Origin region is required")
    private String originRegion;

    @NotNull(message = "Destination port is required")
    private Long destinationPortId;

    @NotNull(message = "Deadline is required")
    @Future(message = "Deadline must be in the future")
    private LocalDate deadline;

    private String contractPreference;

    public CreateCargoRequestDto() {}

    public CreateCargoRequestDto(Long userId, Double tonnage, String originRegion, Long destinationPortId,
                                 LocalDate deadline, String contractPreference) {
        this.userId = userId;
        this.tonnage = tonnage;
        this.originRegion = originRegion;
        this.destinationPortId = destinationPortId;
        this.deadline = deadline;
        this.contractPreference = contractPreference;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Double getTonnage() { return tonnage; }
    public void setTonnage(Double tonnage) { this.tonnage = tonnage; }

    public String getOriginRegion() { return originRegion; }
    public void setOriginRegion(String originRegion) { this.originRegion = originRegion; }

    public Long getDestinationPortId() { return destinationPortId; }
    public void setDestinationPortId(Long destinationPortId) { this.destinationPortId = destinationPortId; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public String getContractPreference() { return contractPreference; }
    public void setContractPreference(String contractPreference) { this.contractPreference = contractPreference; }
}
