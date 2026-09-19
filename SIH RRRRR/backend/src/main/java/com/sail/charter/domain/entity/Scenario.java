package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "scenarios")
public class Scenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cargo_request_id", nullable = false)
    private CargoRequest cargoRequest;

    @Column(name = "input_perturbation_json", columnDefinition = "TEXT")
    private String inputPerturbationJson;

    @Column(name = "resulting_recommendation_json", columnDefinition = "TEXT")
    private String resultingRecommendationJson;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public Scenario() {}

    public Scenario(Long id, CargoRequest cargoRequest, String inputPerturbationJson,
                    String resultingRecommendationJson, OffsetDateTime createdAt) {
        this.id = id;
        this.cargoRequest = cargoRequest;
        this.inputPerturbationJson = inputPerturbationJson;
        this.resultingRecommendationJson = resultingRecommendationJson;
        this.createdAt = createdAt != null ? createdAt : OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CargoRequest getCargoRequest() { return cargoRequest; }
    public void setCargoRequest(CargoRequest cargoRequest) { this.cargoRequest = cargoRequest; }

    public String getInputPerturbationJson() { return inputPerturbationJson; }
    public void setInputPerturbationJson(String inputPerturbationJson) { this.inputPerturbationJson = inputPerturbationJson; }

    public String getResultingRecommendationJson() { return resultingRecommendationJson; }
    public void setResultingRecommendationJson(String resultingRecommendationJson) { this.resultingRecommendationJson = resultingRecommendationJson; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
