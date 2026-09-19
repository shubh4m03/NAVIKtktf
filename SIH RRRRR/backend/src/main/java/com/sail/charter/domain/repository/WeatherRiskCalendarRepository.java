package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.WeatherRiskCalendar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeatherRiskCalendarRepository extends JpaRepository<WeatherRiskCalendar, Long> {
    List<WeatherRiskCalendar> findByRegionAndMonth(String region, Integer month);
}
