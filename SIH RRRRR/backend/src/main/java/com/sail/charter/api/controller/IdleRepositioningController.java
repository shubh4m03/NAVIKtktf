package com.sail.charter.api.controller;

import com.sail.charter.api.dto.DecisionChainResponseDto;
import com.sail.charter.api.dto.IdleEstimateResponseDto;
import com.sail.charter.api.exception.ResourceNotFoundException;
import com.sail.charter.domain.entity.CargoRequest;
import com.sail.charter.domain.entity.IdleEstimate;
import com.sail.charter.domain.repository.CargoRequestRepository;
import com.sail.charter.domain.repository.IdleEstimateRepository;
import com.sail.charter.domain.service.CargoDecisionOrchestrator;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST controller for TASK 18 — Idle-Time & Repositioning Engine (§10).
 * Exposes GET /api/v1/cargo-requests/{id}/idle-estimate.
 * Role-gated to ANALYST, MANAGER, and ADMIN.
 */
@RestController
@RequestMapping("/api/v1/cargo-requests")
public class IdleRepositioningController {

    private final IdleEstimateRepository idleEstimateRepository;
    private final CargoRequestRepository cargoRequestRepository;
    private final CargoDecisionOrchestrator cargoDecisionOrchestrator;

    public IdleRepositioningController(
            IdleEstimateRepository idleEstimateRepository,
            CargoRequestRepository cargoRequestRepository,
            CargoDecisionOrchestrator cargoDecisionOrchestrator
    ) {
        this.idleEstimateRepository = idleEstimateRepository;
        this.cargoRequestRepository = cargoRequestRepository;
        this.cargoDecisionOrchestrator = cargoDecisionOrchestrator;
    }

    @GetMapping("/{id}/idle-estimate")
    @PreAuthorize("hasAnyRole('ANALYST', 'MANAGER', 'ADMIN')")
    public ResponseEntity<IdleEstimateResponseDto> getIdleEstimate(@PathVariable Long id) {
        CargoRequest cargoRequest = cargoRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cargo request not found with id: " + id));

        Optional<IdleEstimate> existing = idleEstimateRepository.findFirstByCargoRequestIdOrderByIdDesc(id);
        if (existing.isPresent()) {
            return ResponseEntity.ok(cargoDecisionOrchestrator.mapToDto(existing.get()));
        }

        // If not yet computed, run orchestrator
        DecisionChainResponseDto decisionChain = cargoDecisionOrchestrator.processCargoRequest(id);
        if (decisionChain.getIdleEstimate() != null) {
            return ResponseEntity.ok(decisionChain.getIdleEstimate());
        }

        // Fallback fetch
        return ResponseEntity.ok(
                idleEstimateRepository.findFirstByCargoRequestIdOrderByIdDesc(id)
                        .map(cargoDecisionOrchestrator::mapToDto)
                        .orElseThrow(() -> new ResourceNotFoundException("Idle estimate could not be computed for cargo request: " + id))
        );
    }
}
