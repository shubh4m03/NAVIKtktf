package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.RiskEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskEventRepository extends JpaRepository<RiskEvent, Long> {
    List<RiskEvent> findByCargoRequestId(Long cargoRequestId);
    Optional<RiskEvent> findTopByCargoRequestIdOrderByComputedAtDesc(Long cargoRequestId);
}
