package com.sail.charter.api.controller;

import com.sail.charter.api.dto.CreateCargoRequestDto;
import com.sail.charter.api.dto.DecisionChainResponseDto;
import com.sail.charter.api.dto.ScenarioPerturbationDto;
import com.sail.charter.domain.service.AuditLogService;
import com.sail.charter.domain.service.CargoRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Cargo Request Orchestration API (§18, §27).
 * Role-gated to ANALYST, MANAGER, and ADMIN.
 * Every returned recommendation is recorded in the audit_logs table.
 */
@RestController
@RequestMapping("/api/v1/cargo-requests")
public class CargoRequestController {

    private final CargoRequestService cargoRequestService;
    private final AuditLogService auditLogService;

    public CargoRequestController(
            CargoRequestService cargoRequestService,
            AuditLogService auditLogService
    ) {
        this.cargoRequestService = cargoRequestService;
        this.auditLogService = auditLogService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ANALYST', 'MANAGER', 'ADMIN')")
    public ResponseEntity<DecisionChainResponseDto> createCargoRequest(@Valid @RequestBody CreateCargoRequestDto requestDto) {
        DecisionChainResponseDto responseDto = cargoRequestService.createAndProcessCargoRequest(requestDto);

        // Audit log recommendation per §17 & §27
        if (responseDto != null && responseDto.getRecommendation() != null) {
            auditLogService.logRecommendationShown(
                    responseDto.getId(),
                    responseDto.getRecommendation().getAction(),
                    responseDto.getRecommendation().getSplitPct(),
                    responseDto.getRecommendation()
            );
        }

        return ResponseEntity.ok(responseDto);
    }

    @GetMapping("/{id}/recommendation")
    @PreAuthorize("hasAnyRole('ANALYST', 'MANAGER', 'ADMIN')")
    public ResponseEntity<DecisionChainResponseDto> getRecommendation(@PathVariable Long id) {
        DecisionChainResponseDto responseDto = cargoRequestService.getRecommendation(id);

        if (responseDto != null && responseDto.getRecommendation() != null) {
            auditLogService.logRecommendationShown(
                    responseDto.getId(),
                    responseDto.getRecommendation().getAction(),
                    responseDto.getRecommendation().getSplitPct(),
                    responseDto.getRecommendation()
            );
        }

        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("/{id}/scenario")
    @PreAuthorize("hasAnyRole('ANALYST', 'MANAGER', 'ADMIN')")
    public ResponseEntity<DecisionChainResponseDto> runScenario(
            @PathVariable Long id,
            @RequestBody(required = false) ScenarioPerturbationDto perturbationDto
    ) {
        DecisionChainResponseDto responseDto = cargoRequestService.runScenario(
                id,
                perturbationDto != null ? perturbationDto : new ScenarioPerturbationDto()
        );

        if (responseDto != null && responseDto.getRecommendation() != null) {
            auditLogService.logRecommendationShown(
                    responseDto.getId(),
                    "SCENARIO_" + responseDto.getRecommendation().getAction(),
                    responseDto.getRecommendation().getSplitPct(),
                    responseDto.getRecommendation()
            );
        }

        return ResponseEntity.ok(responseDto);
    }
}
