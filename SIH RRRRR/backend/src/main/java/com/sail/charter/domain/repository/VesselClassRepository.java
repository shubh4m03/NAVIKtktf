package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.VesselClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VesselClassRepository extends JpaRepository<VesselClass, Long> {
    Optional<VesselClass> findByName(String name);
}
