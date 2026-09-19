package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.ForecastRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ForecastRunRepository extends JpaRepository<ForecastRun, Long> {
    List<ForecastRun> findByCargoRequestId(Long cargoRequestId);
    Optional<ForecastRun> findTopByCargoRequestIdOrderByGeneratedAtDesc(Long cargoRequestId);
    Optional<ForecastRun> findTopByRouteIdAndVesselClassIdOrderByGeneratedAtDesc(Long routeId, Long vesselClassId);
}
