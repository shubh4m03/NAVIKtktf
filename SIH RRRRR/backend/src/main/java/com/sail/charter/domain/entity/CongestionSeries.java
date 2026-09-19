package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "congestion_series", indexes = {
    @Index(name = "idx_congestion_port_date", columnList = "port_id, date")
})
public class CongestionSeries {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "port_id", nullable = false)
    private Port port;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "congestion_score", nullable = false)
    private Double congestionScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 50)
    private DataProvenance dataProvenance;

    public CongestionSeries() {}

    public CongestionSeries(Long id, Port port, LocalDate date, Double congestionScore, DataProvenance dataProvenance) {
        this.id = id;
        this.port = port;
        this.date = date;
        this.congestionScore = congestionScore;
        this.dataProvenance = dataProvenance;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Port getPort() { return port; }
    public void setPort(Port port) { this.port = port; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Double getCongestionScore() { return congestionScore; }
    public void setCongestionScore(Double congestionScore) { this.congestionScore = congestionScore; }

    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }
}
