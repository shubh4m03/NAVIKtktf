package com.sail.charter.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "weather_risk_calendar")
public class WeatherRiskCalendar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String region;

    @Column(nullable = false)
    private Integer month;

    @Column(name = "risk_level", nullable = false, length = 20)
    private String riskLevel;

    @Column(length = 500)
    private String note;

    public WeatherRiskCalendar() {}

    public WeatherRiskCalendar(Long id, String region, Integer month, String riskLevel, String note) {
        this.id = id;
        this.region = region;
        this.month = month;
        this.riskLevel = riskLevel;
        this.note = note;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
