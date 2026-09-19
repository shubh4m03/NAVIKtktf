package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByCargoRequestId(Long cargoRequestId);
    Optional<Recommendation> findTopByCargoRequestIdOrderByCreatedAtDesc(Long cargoRequestId);
}
