package com.sail.charter.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "forecast_results")
public class ForecastResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forecast_run_id", nullable = false)
    private ForecastRun forecastRun;

    @Column(name = "expected_value", nullable = false)
    private Double expectedValue;

    @Column(name = "interval_50_low")
    private Double interval50Low;

    @Column(name = "interval_50_high")
    private Double interval50High;

    @Column(name = "interval_90_low")
    private Double interval90Low;

    @Column(name = "interval_90_high")
    private Double interval90High;

    @Column(name = "prob_increase_pct")
    private Double probIncreasePct;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "data_provenance_json", columnDefinition = "TEXT")
    private String dataProvenanceJson;

    public ForecastResult() {}

    public ForecastResult(Long id, ForecastRun forecastRun, Double expectedValue, Double interval50Low,
                          Double interval50High, Double interval90Low, Double interval90High,
                          Double probIncreasePct, Double confidenceScore, String dataProvenanceJson) {
        this.id = id;
        this.forecastRun = forecastRun;
        this.expectedValue = expectedValue;
        this.interval50Low = interval50Low;
        this.interval50High = interval50High;
        this.interval90Low = interval90Low;
        this.interval90High = interval90High;
        this.probIncreasePct = probIncreasePct;
        this.confidenceScore = confidenceScore;
        this.dataProvenanceJson = dataProvenanceJson;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ForecastRun getForecastRun() { return forecastRun; }
    public void setForecastRun(ForecastRun forecastRun) { this.forecastRun = forecastRun; }

    public Double getExpectedValue() { return expectedValue; }
    public void setExpectedValue(Double expectedValue) { this.expectedValue = expectedValue; }

    public Double getInterval50Low() { return interval50Low; }
    public void setInterval50Low(Double interval50Low) { this.interval50Low = interval50Low; }

    public Double getInterval50High() { return interval50High; }
    public void setInterval50High(Double interval50High) { this.interval50High = interval50High; }

    public Double getInterval90Low() { return interval90Low; }
    public void setInterval90Low(Double interval90Low) { this.interval90Low = interval90Low; }

    public Double getInterval90High() { return interval90High; }
    public void setInterval90High(Double interval90High) { this.interval90High = interval90High; }

    public Double getProbIncreasePct() { return probIncreasePct; }
    public void setProbIncreasePct(Double probIncreasePct) { this.probIncreasePct = probIncreasePct; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getDataProvenanceJson() { return dataProvenanceJson; }
    public void setDataProvenanceJson(String dataProvenanceJson) { this.dataProvenanceJson = dataProvenanceJson; }
}
