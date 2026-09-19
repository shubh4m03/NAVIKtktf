package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.PortConstraint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortConstraintRepository extends JpaRepository<PortConstraint, Long> {
    List<PortConstraint> findByPortId(Long portId);
    Optional<PortConstraint> findTopByPortId(Long portId);
}

