package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByOriginRegion(String originRegion);
    List<Route> findByDestinationPortId(Long destinationPortId);
    Optional<Route> findByOriginRegionAndDestinationPortId(String originRegion, Long destinationPortId);
}

