package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.VesselRanking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VesselRankingRepository extends JpaRepository<VesselRanking, Long> {
    List<VesselRanking> findByForecastRunId(Long forecastRunId);
    List<VesselRanking> findByForecastRunIdOrderByScoreDesc(Long forecastRunId);
}
