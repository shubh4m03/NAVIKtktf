"""Tests for service-to-service internal token security (§27)."""

import sys
import unittest
from pathlib import Path
from fastapi import HTTPException

CURRENT_DIR = Path(__file__).resolve().parent
ML_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(ML_DIR))

from app.security import verify_internal_service_token, EXPECTED_INTERNAL_TOKEN


class TestServiceSecurity(unittest.TestCase):

    def test_valid_internal_token_succeeds(self):
        token = verify_internal_service_token(EXPECTED_INTERNAL_TOKEN)
        self.assertEqual(token, EXPECTED_INTERNAL_TOKEN)

    def test_missing_internal_token_rejected_with_403(self):
        with self.assertRaises(HTTPException) as cm:
            verify_internal_service_token(None)
        self.assertEqual(cm.exception.status_code, 403)
        self.assertIn("Invalid or missing internal service token", cm.exception.detail)

    def test_invalid_internal_token_rejected_with_403(self):
        with self.assertRaises(HTTPException) as cm:
            verify_internal_service_token("wrong-secret-token")
        self.assertEqual(cm.exception.status_code, 403)

    def test_user_jwt_forwarding_strictly_rejected(self):
        with self.assertRaises(HTTPException) as cm:
            verify_internal_service_token("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        self.assertEqual(cm.exception.status_code, 403)
        self.assertIn("User JWT forwarded", cm.exception.detail)


if __name__ == "__main__":
    unittest.main()
