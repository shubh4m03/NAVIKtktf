package com.sail.charter.api.controller;

import com.sail.charter.domain.entity.AuditLog;
import com.sail.charter.domain.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for retrieving audit trails (§18, §27).
 * Role-gated strictly to ADMIN.
 */
@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    private final AuditLogService auditLogService;

    public AuditController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLogResponseDto>> getRecentAuditLogs(
            @RequestParam(defaultValue = "50") int limit
    ) {
        List<AuditLog> logs = auditLogService.getRecentAuditLogs(limit);
        List<AuditLogResponseDto> dtos = logs.stream()
                .map(l -> new AuditLogResponseDto(
                        l.getId(),
                        l.getUser() != null ? l.getUser().getUsername() : "SYSTEM",
                        l.getAction(),
                        l.getEntityType(),
                        l.getEntityId(),
                        l.getPayloadJson(),
                        l.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    public static class AuditLogResponseDto {
        private Long id;
        private String username;
        private String action;
        private String entityType;
        private Long entityId;
        private String payloadJson;
        private OffsetDateTime createdAt;

        public AuditLogResponseDto() {}

        public AuditLogResponseDto(Long id, String username, String action, String entityType, Long entityId, String payloadJson, OffsetDateTime createdAt) {
            this.id = id;
            this.username = username;
            this.action = action;
            this.entityType = entityType;
            this.entityId = entityId;
            this.payloadJson = payloadJson;
            this.createdAt = createdAt;
        }

        public Long getId() { return id; }
        public String getUsername() { return username; }
        public String getAction() { return action; }
        public String getEntityType() { return entityType; }
        public Long getEntityId() { return entityId; }
        public String getPayloadJson() { return payloadJson; }
        public OffsetDateTime getCreatedAt() { return createdAt; }
    }
}
