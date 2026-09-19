package com.sail.charter.domain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sail.charter.domain.entity.AuditLog;
import com.sail.charter.domain.entity.User;
import com.sail.charter.domain.repository.AuditLogRepository;
import com.sail.charter.domain.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service managing audit trails per Section 17 & 27.
 * Logs every recommendation shown and every charter contract recorded.
 */
@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper
    ) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AuditLog logRecommendationShown(Long recommendationId, String action, Double splitPct, Object details) {
        try {
            User currentUser = resolveCurrentUser();
            Map<String, Object> payload = new HashMap<>();
            payload.put("recommendation_id", recommendationId);
            payload.put("action", action);
            payload.put("split_pct", splitPct);
            if (details != null) {
                payload.put("details", details);
            }

            AuditLog auditLog = new AuditLog(
                    null,
                    currentUser,
                    "RECOMMENDATION_SHOWN",
                    "RECOMMENDATION",
                    recommendationId,
                    objectMapper.writeValueAsString(payload),
                    OffsetDateTime.now()
            );

            AuditLog saved = auditLogRepository.save(auditLog);
            log.info("Audit logged RECOMMENDATION_SHOWN for id={}, action={}", recommendationId, action);
            return saved;
        } catch (Exception e) {
            log.error("Failed to persist audit log for recommendation: {}", e.getMessage(), e);
            return null;
        }
    }

    @Transactional
    public AuditLog logContractRecorded(Long contractId, Long cargoRequestId, String contractType, Double tonnage, Double fixedRate) {
        try {
            User currentUser = resolveCurrentUser();
            Map<String, Object> payload = new HashMap<>();
            payload.put("contract_id", contractId);
            payload.put("cargo_request_id", cargoRequestId);
            payload.put("contract_type", contractType);
            payload.put("tonnage", tonnage);
            payload.put("fixed_rate", fixedRate);

            AuditLog auditLog = new AuditLog(
                    null,
                    currentUser,
                    "CONTRACT_RECORDED",
                    "CONTRACT",
                    contractId,
                    objectMapper.writeValueAsString(payload),
                    OffsetDateTime.now()
            );

            AuditLog saved = auditLogRepository.save(auditLog);
            log.info("Audit logged CONTRACT_RECORDED for contractId={}, cargoRequestId={}", contractId, cargoRequestId);
            return saved;
        } catch (Exception e) {
            log.error("Failed to persist audit log for contract: {}", e.getMessage(), e);
            return null;
        }
    }

    public List<AuditLog> getRecentAuditLogs(int limit) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.min(100, limit)));
    }

    private User resolveCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
                String username = auth.getName();
                return userRepository.findByUsername(username).orElse(null);
            }
        } catch (Exception e) {
            log.debug("Could not resolve current user for audit: {}", e.getMessage());
        }
        return null;
    }
}
