package com.sail.charter.api.dto;

import java.util.List;

public class PortDto {
    private Long id;
    private String name;
    private String code;
    private String region;
    private Double lat;
    private Double lon;
    private List<PortConstraintDto> constraints;

    public PortDto() {}

    public PortDto(Long id, String name, String code, String region, Double lat, Double lon, List<PortConstraintDto> constraints) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.region = region;
        this.lat = lat;
        this.lon = lon;
        this.constraints = constraints;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLon() { return lon; }
    public void setLon(Double lon) { this.lon = lon; }

    public List<PortConstraintDto> getConstraints() { return constraints; }
    public void setConstraints(List<PortConstraintDto> constraints) { this.constraints = constraints; }
}
