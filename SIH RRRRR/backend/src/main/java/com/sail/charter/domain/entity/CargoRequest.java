package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "cargo_requests", indexes = {
    @Index(name = "idx_cargo_requests_user_status", columnList = "user_id, status")
})
public class CargoRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double tonnage;

    @Column(name = "origin_region", nullable = false, length = 100)
    private String originRegion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_port_id", nullable = false)
    private Port destinationPort;

    @Column(nullable = false)
    private LocalDate deadline;

    @Column(name = "contract_preference", length = 50)
    private String contractPreference;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(nullable = false, length = 50)
    private String status;

    public CargoRequest() {}

    public CargoRequest(Long id, User user, Double tonnage, String originRegion, Port destinationPort,
                        LocalDate deadline, String contractPreference, OffsetDateTime createdAt, String status) {
        this.id = id;
        this.user = user;
        this.tonnage = tonnage;
        this.originRegion = originRegion;
        this.destinationPort = destinationPort;
        this.deadline = deadline;
        this.contractPreference = contractPreference;
        this.createdAt = createdAt != null ? createdAt : OffsetDateTime.now();
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Double getTonnage() { return tonnage; }
    public void setTonnage(Double tonnage) { this.tonnage = tonnage; }

    public String getOriginRegion() { return originRegion; }
    public void setOriginRegion(String originRegion) { this.originRegion = originRegion; }

    public Port getDestinationPort() { return destinationPort; }
    public void setDestinationPort(Port destinationPort) { this.destinationPort = destinationPort; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public String getContractPreference() { return contractPreference; }
    public void setContractPreference(String contractPreference) { this.contractPreference = contractPreference; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
