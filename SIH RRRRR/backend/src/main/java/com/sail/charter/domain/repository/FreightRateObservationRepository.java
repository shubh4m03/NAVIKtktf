package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.FreightRateObservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FreightRateObservationRepository extends JpaRepository<FreightRateObservation, Long> {

    @Query("""
        SELECT f FROM FreightRateObservation f
         WHERE f.originRegion = :originRegion
           AND f.destinationPort.id = :destinationPortId
           AND f.observationDate >= :since
         ORDER BY f.observationDate ASC
        """)
    List<FreightRateObservation> findByRouteAndSince(
            @Param("originRegion") String originRegion,
            @Param("destinationPortId") Long destinationPortId,
            @Param("since") LocalDate since
    );

    @Query("""
        SELECT DISTINCT f.originRegion FROM FreightRateObservation f ORDER BY f.originRegion
        """)
    List<String> findDistinctOriginRegions();
}
