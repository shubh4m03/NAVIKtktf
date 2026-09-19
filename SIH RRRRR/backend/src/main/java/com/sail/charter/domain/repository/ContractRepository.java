package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {
    List<Contract> findByCargoRequestId(Long cargoRequestId);
}
