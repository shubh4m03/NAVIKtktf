package com.sail.charter.api.controller;

import com.sail.charter.api.dto.ContractResponseDto;
import com.sail.charter.api.dto.CreateContractDto;
import com.sail.charter.domain.entity.CargoRequest;
import com.sail.charter.domain.entity.Contract;
import com.sail.charter.domain.entity.ContractType;
import com.sail.charter.domain.repository.CargoRequestRepository;
import com.sail.charter.domain.repository.ContractRepository;
import com.sail.charter.domain.service.AuditLogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;

/**
 * Controller for recording charter contracts (§18, §27).
 * Role-gated to MANAGER and ADMIN. Every recorded contract triggers an audit log.
 */
@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {

    private final ContractRepository contractRepository;
    private final CargoRequestRepository cargoRequestRepository;
    private final AuditLogService auditLogService;

    public ContractController(
            ContractRepository contractRepository,
            CargoRequestRepository cargoRequestRepository,
            AuditLogService auditLogService
    ) {
        this.contractRepository = contractRepository;
        this.cargoRequestRepository = cargoRequestRepository;
        this.auditLogService = auditLogService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ContractResponseDto> recordContract(@Valid @RequestBody CreateContractDto request) {
        CargoRequest cargoRequest = cargoRequestRepository.findById(request.getCargoRequestId())
                .orElse(null);

        ContractType type;
        try {
            type = ContractType.valueOf(request.getContractType().toUpperCase().replace(" ", "_"));
        } catch (Exception e) {
            type = ContractType.SPOT;
        }

        Contract contract = new Contract(
                null,
                cargoRequest,
                type,
                request.getTonnage(),
                request.getFixedRate(),
                OffsetDateTime.now(),
                "EXECUTED"
        );

        Contract saved = contractRepository.save(contract);

        // Audit log per §17 and §27
        auditLogService.logContractRecorded(
                saved.getId(),
                request.getCargoRequestId(),
                type.name(),
                request.getTonnage(),
                request.getFixedRate()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(new ContractResponseDto(
                saved.getId(),
                request.getCargoRequestId(),
                type.name().toLowerCase(),
                saved.getTonnage(),
                saved.getFixedRate(),
                saved.getFixedAt(),
                saved.getStatus()
        ));
    }
}
