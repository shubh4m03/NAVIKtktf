package com.sail.charter.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Standard HMAC-SHA256 JWT Token Provider (§27).
 * Implemented using pure Java Standard Library crypto + Jackson,
 * requiring zero external third-party dependencies.
 */
@Component
public class JwtTokenProvider {

    private final byte[] secretKey;
    private final long accessTokenValidityMs;
    private final long refreshTokenValidityMs;
    private final ObjectMapper objectMapper;

    public JwtTokenProvider(
            @Value("${security.jwt.secret:charter-intelligence-secure-jwt-signing-secret-key-2026-sih}") String secret,
            @Value("${security.jwt.access-token-validity-ms:900000}") long accessTokenValidityMs,       // 15 mins default
            @Value("${security.jwt.refresh-token-validity-ms:604800000}") long refreshTokenValidityMs,   // 7 days default
            ObjectMapper objectMapper
    ) {
        this.secretKey = secret.getBytes(StandardCharsets.UTF_8);
        this.accessTokenValidityMs = accessTokenValidityMs;
        this.refreshTokenValidityMs = refreshTokenValidityMs;
        this.objectMapper = objectMapper;
    }

    public String generateAccessToken(String username, String role) {
        return buildToken(username, role, "access", accessTokenValidityMs);
    }

    public String generateRefreshToken(String username, String role) {
        return buildToken(username, role, "refresh", refreshTokenValidityMs);
    }

    private String buildToken(String username, String role, String type, long validityMs) {
        try {
            long now = Instant.now().getEpochSecond();
            long exp = now + (validityMs / 1000);

            // Header
            Map<String, Object> header = new HashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");
            String headerJson = objectMapper.writeValueAsString(header);
            String headerBase64 = base64UrlEncode(headerJson.getBytes(StandardCharsets.UTF_8));

            // Payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("sub", username);
            payload.put("role", role.toUpperCase());
            payload.put("type", type);
            payload.put("iat", now);
            payload.put("exp", exp);
            String payloadJson = objectMapper.writeValueAsString(payload);
            String payloadBase64 = base64UrlEncode(payloadJson.getBytes(StandardCharsets.UTF_8));

            // Signature
            String content = headerBase64 + "." + payloadBase64;
            String signature = sign(content);

            return content + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Error generating JWT token", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String content = parts[0] + "." + parts[1];
            String expectedSig = sign(content);
            if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8), expectedSig.getBytes(StandardCharsets.UTF_8))) {
                return false;
            }

            Map<String, Object> claims = parseClaims(token);
            Number expNum = (Number) claims.get("exp");
            if (expNum == null || Instant.now().getEpochSecond() > expNum.longValue()) {
                return false;
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getUsernameFromToken(String token) {
        Map<String, Object> claims = parseClaims(token);
        return (String) claims.get("sub");
    }

    public String getRoleFromToken(String token) {
        Map<String, Object> claims = parseClaims(token);
        return (String) claims.get("role");
    }

    public String getTokenType(String token) {
        Map<String, Object> claims = parseClaims(token);
        return (String) claims.get("type");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parseClaims(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid JWT token format");
            }
            byte[] decoded = base64UrlDecode(parts[1]);
            return objectMapper.readValue(decoded, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse JWT claims", e);
        }
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(this.secretKey, "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(hash);
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] base64UrlDecode(String str) {
        return Base64.getUrlDecoder().decode(str);
    }
}
