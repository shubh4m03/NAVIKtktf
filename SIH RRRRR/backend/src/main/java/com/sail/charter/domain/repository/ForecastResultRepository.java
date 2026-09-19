package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.ForecastResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForecastResultRepository extends JpaRepository<ForecastResult, Long> {
    List<ForecastResult> findByForecastRunId(Long forecastRunId);
    Optional<ForecastResult> findTopByForecastRunId(Long forecastRunId);
}
