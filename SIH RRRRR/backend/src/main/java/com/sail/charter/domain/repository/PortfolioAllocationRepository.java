package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.PortfolioAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PortfolioAllocationRepository extends JpaRepository<PortfolioAllocation, Long> {

    Optional<PortfolioAllocation> findFirstByCargoRequestIdOrderByIdDesc(Long cargoRequestId);
}
