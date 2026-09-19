package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.Vessel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VesselRepository extends JpaRepository<Vessel, Long> {
    List<Vessel> findByVesselClassId(Long vesselClassId);
}
