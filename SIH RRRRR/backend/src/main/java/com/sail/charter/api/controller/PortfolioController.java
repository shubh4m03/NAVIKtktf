package com.sail.charter.api.controller;

import com.sail.charter.api.dto.PortfolioAllocationResponseDto;
import com.sail.charter.client.mlservice.dto.ForecastResponseDto;
import com.sail.charter.domain.entity.CargoRequest;
import com.sail.charter.domain.entity.PortfolioAllocation;
import com.sail.charter.domain.repository.CargoRequestRepository;
import com.sail.charter.domain.repository.PortfolioAllocationRepository;
import com.sail.charter.domain.service.CargoDecisionOrchestrator;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Task 19 / §13 — Charter Portfolio Strategy REST endpoint.
 *
 * GET /api/v1/cargo-requests/{id}/portfolio
 *   Returns the mean-variance portfolio allocation for a cargo request.
 *   If not yet computed, triggers computation with balanced lambda (0.5).
 *
 * POST /api/v1/cargo-requests/{id}/portfolio?lambda={value}
 *   Recomputes the portfolio with the specified risk-aversion lambda.
 *   lambda values: Conservative=1.0, Balanced=0.5, Aggressive=0.1 (§13)
 */
@RestController
@RequestMapping("/api/v1/cargo-requests")
public class PortfolioController {

    private final CargoRequestRepository cargoRequestRepository;
    private final PortfolioAllocationRepository portfolioAllocationRepository;
    private final CargoDecisionOrchestrator orchestrator;

    public PortfolioController(CargoRequestRepository cargoRequestRepository,
                                PortfolioAllocationRepository portfolioAllocationRepository,
                                CargoDecisionOrchestrator orchestrator) {
        this.cargoRequestRepository = cargoRequestRepository;
        this.portfolioAllocationRepository = portfolioAllocationRepository;
        this.orchestrator = orchestrator;
    }

    /**
     * GET /api/v1/cargo-requests/{id}/portfolio
     * Returns the latest persisted portfolio allocation for this cargo request.
     */
    @GetMapping("/{id}/portfolio")
    @PreAuthorize("hasAnyRole('ANALYST', 'MANAGER', 'ADMIN')")
    public ResponseEntity<PortfolioAllocationResponseDto> getPortfolioAllocation(@PathVariable Long id) {
        cargoRequestRepository.findById(id)
                .orElseThrow(() -> new com.sail.charter.api.exception.ResourceNotFoundException(
                        "CargoRequest not found: " + id));

        Optional<PortfolioAllocation> existing = portfolioAllocationRepository
                .findFirstByCargoRequestIdOrderByIdDesc(id);

        if (existing.isPresent()) {
            return ResponseEntity.ok(orchestrator.mapPortfolioToDto(existing.get()));
        }
        // Not yet computed — return 404 so caller knows to trigger via main pipeline
        return ResponseEntity.notFound().build();
    }

    /**
     * POST /api/v1/cargo-requests/{id}/portfolio?lambda={value}
     * Recomputes portfolio allocation with the given risk-aversion lambda.
     * lambda: Conservative=1.0, Balanced=0.5, Aggressive=0.1
     */
    @PostMapping("/{id}/portfolio")
    @PreAuthorize("hasAnyRole('ANALYST', 'MANAGER', 'ADMIN')")
    public ResponseEntity<PortfolioAllocationResponseDto> recomputePortfolio(
            @PathVariable Long id,
            @RequestParam(name = "lambda", defaultValue = "0.5") double lambda
    ) {
        CargoRequest cargoRequest = cargoRequestRepository.findById(id)
                .orElseThrow(() -> new com.sail.charter.api.exception.ResourceNotFoundException(
                        "CargoRequest not found: " + id));

        // Build a minimal forecast from any existing portfolio or use defaults
        Optional<PortfolioAllocation> existing = portfolioAllocationRepository
                .findFirstByCargoRequestIdOrderByIdDesc(id);

        // Use a fallback forecast structure sufficient for the optimizer
        double expectedRate = 28.0;
        List<Double> interval90 = List.of(22.0, 36.0);

        if (existing.isPresent()) {
            // We can reuse the last computed cost to back out approximate rate
            double totalCost = existing.get().getTotalExpectedCostUsd();
            double tonnage   = cargoRequest.getTonnage();
            if (tonnage > 0 && totalCost > 0) {
                expectedRate = totalCost / tonnage;
            }
        }

        ForecastResponseDto pseudoForecast = new ForecastResponseDto(
                expectedRate,
                List.of(expectedRate * 0.96, expectedRate * 1.04),
                interval90,
                0.3,
                75.0,
                "cached_proxy",
                Map.of("basis", "SIMULATED", "note", "Derived from last known allocation"),
                java.time.OffsetDateTime.now().toString()
        );

        PortfolioAllocationResponseDto result = orchestrator.computeAndSavePortfolioAllocation(
                cargoRequest, pseudoForecast, lambda);

        return ResponseEntity.ok(result);
    }
}
