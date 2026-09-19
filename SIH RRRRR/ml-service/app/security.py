"""
Internal Service-to-Service Security (§27).
Protects internal ML service endpoints from direct external calls.
Verifies internal service token and strictly rejects forwarded user JWTs.
"""

import os
from typing import Optional
from fastapi import Header, HTTPException

EXPECTED_INTERNAL_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "charter-internal-service-secret-token-2026")


def verify_internal_service_token(
    x_internal_service_token: Optional[str] = Header(None)
) -> str:
    """
    Validates X-Internal-Service-Token header.
    Ensures callers use the internal shared secret, never passing user JWTs.
    """
    if not x_internal_service_token or x_internal_service_token != EXPECTED_INTERNAL_TOKEN:
        # Detect if a JWT was mistakenly forwarded
        if x_internal_service_token and x_internal_service_token.startswith("Bearer "):
            raise HTTPException(
                status_code=403,
                detail="Security violation: User JWT forwarded to internal ML service. Service-to-service token required (§27)."
            )
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Invalid or missing internal service token (§27)."
        )
    return x_internal_service_token
