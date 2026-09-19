package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.CargoRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CargoRequestRepository extends JpaRepository<CargoRequest, Long> {
    List<CargoRequest> findByUserId(Long userId);
    List<CargoRequest> findByUserIdAndStatus(Long userId, String status);
}
