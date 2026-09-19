package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.IdleEstimate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IdleEstimateRepository extends JpaRepository<IdleEstimate, Long> {
    List<IdleEstimate> findByCargoRequestId(Long cargoRequestId);
    Optional<IdleEstimate> findFirstByCargoRequestIdOrderByIdDesc(Long cargoRequestId);
}
