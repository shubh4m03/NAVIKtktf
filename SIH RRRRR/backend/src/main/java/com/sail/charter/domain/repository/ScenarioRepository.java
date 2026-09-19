package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.Scenario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScenarioRepository extends JpaRepository<Scenario, Long> {
    List<Scenario> findByCargoRequestId(Long cargoRequestId);
}
