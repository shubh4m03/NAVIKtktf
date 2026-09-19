package com.sail.charter.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "fx_rate_series")
public class FxRateSeries {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 20)
    private String pair;

    @Column(nullable = false)
    private Double value;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_provenance", nullable = false, length = 50)
    private DataProvenance dataProvenance;

    @Column(nullable = false, length = 255)
    private String source;

    public FxRateSeries() {}

    public FxRateSeries(Long id, LocalDate date, String pair, Double value, DataProvenance dataProvenance, String source) {
        this.id = id;
        this.date = date;
        this.pair = pair;
        this.value = value;
        this.dataProvenance = dataProvenance;
        this.source = source;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getPair() { return pair; }
    public void setPair(String pair) { this.pair = pair; }

    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }

    public DataProvenance getDataProvenance() { return dataProvenance; }
    public void setDataProvenance(DataProvenance dataProvenance) { this.dataProvenance = dataProvenance; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
