"""Unit and integration tests for market data ingestion pipeline."""

import unittest
from unittest.mock import patch, MagicMock
from datetime import date
import sys
from pathlib import Path

# Add paths for imports
CURRENT_DIR = Path(__file__).resolve().parent
PIPELINE_DIR = CURRENT_DIR.parent
sys.path.insert(0, str(PIPELINE_DIR / "ingestion"))
sys.path.insert(0, str(PIPELINE_DIR))

import freight_index
import bunker
import fx
import base
from run_all import run_all


class TestMarketDataIngestion(unittest.TestCase):

    @patch("freight_index.requests.get")
    def test_freight_index_parsing_and_provenance(self, mock_get):
        """Verify freight index parsing and explicit PUBLIC_PROXY provenance tagging."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "chart": {
                "result": [
                    {
                        "timestamp": [1726000000, 1726086400],
                        "indicators": {
                            "quote": [
                                {
                                    "close": [14.50, 15.25]
                                }
                            ]
                        }
                    }
                ]
            }
        }
        mock_get.return_value = mock_response

        records = freight_index.fetch()
        self.assertEqual(len(records), 2)
        for r in records:
            self.assertEqual(r["index_name"], "BDRY")
            self.assertEqual(r["data_provenance"], "PUBLIC_PROXY")
            self.assertIn("Yahoo Finance", r["source"])
            self.assertIsInstance(r["date"], date)
            self.assertGreater(r["value"], 0)

    @patch("bunker.requests.get")
    def test_bunker_parsing_and_provenance(self, mock_get):
        """Verify bunker/crude parsing and explicit PUBLIC_PROXY provenance tagging."""
        mock_csv = "observation_date,DCOILBRENTEU\n2026-09-08,82.45\n2026-09-09,83.10\n2026-09-10,.\n"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_csv
        mock_get.return_value = mock_response

        records = bunker.fetch(cutoff_days=365)
        self.assertEqual(len(records), 2)  # skips missing '.'
        for r in records:
            self.assertEqual(r["data_provenance"], "PUBLIC_PROXY")
            self.assertIn("FRED", r["source"])
            self.assertIsInstance(r["date"], date)
            self.assertGreater(r["value"], 0)
        self.assertEqual(records[0]["value"], 82.45)
        self.assertEqual(records[1]["value"], 83.10)

    @patch("fx.requests.get")
    def test_fx_parsing_and_provenance(self, mock_get):
        """Verify FX parsing and explicit REAL_VERIFIED provenance tagging."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "amount": 1.0,
            "base": "USD",
            "start_date": "2026-09-08",
            "rates": {
                "2026-09-08": {"INR": 83.92},
                "2026-09-09": {"INR": 84.05}
            }
        }
        mock_get.return_value = mock_response

        records = fx.fetch()
        self.assertEqual(len(records), 2)
        for r in records:
            self.assertEqual(r["pair"], "USD/INR")
            self.assertEqual(r["data_provenance"], "REAL_VERIFIED")
            self.assertIn("Frankfurter", r["source"])
            self.assertIsInstance(r["date"], date)
            self.assertGreater(r["value"], 80.0)

    @patch("bunker.fetch")
    def test_source_isolation_on_failure(self, mock_bunker_fetch):
        """Verify that failure in one source does not crash the others."""
        mock_bunker_fetch.side_effect = ConnectionError("Simulated upstream network down")

        # run_all should complete without unhandled exception
        summary = run_all()
        self.assertIn("bunker", summary["results"])
        self.assertIn("freight_index", summary["results"])
        self.assertIn("fx", summary["results"])
        self.assertEqual(summary["results"]["bunker"]["status"], "FAILED")
        self.assertEqual(summary["results"]["freight_index"]["status"], "SUCCESS")
        self.assertEqual(summary["results"]["fx"]["status"], "SUCCESS")

    def test_idempotency_database_insert(self):
        """Verify running ingestion twice results in 0 newly inserted duplicate rows."""
        conn = base.get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT count(*) FROM freight_index_series;")
                freight_before = cur.fetchone()[0]
                cur.execute("SELECT count(*) FROM bunker_price_series;")
                bunker_before = cur.fetchone()[0]
                cur.execute("SELECT count(*) FROM fx_rate_series;")
                fx_before = cur.fetchone()[0]

            # Run all ingestion jobs a second time
            res_freight = freight_index.validate_and_store(conn=conn)
            res_bunker = bunker.validate_and_store(conn=conn)
            res_fx = fx.validate_and_store(conn=conn)

            # Assert 0 new rows inserted
            self.assertEqual(res_freight["inserted"], 0, "Freight index re-run should insert 0 duplicates")
            self.assertEqual(res_bunker["inserted"], 0, "Bunker re-run should insert 0 duplicates")
            self.assertEqual(res_fx["inserted"], 0, "FX re-run should insert 0 duplicates")

            # Assert database row count is unchanged
            with conn.cursor() as cur:
                cur.execute("SELECT count(*) FROM freight_index_series;")
                freight_after = cur.fetchone()[0]
                cur.execute("SELECT count(*) FROM bunker_price_series;")
                bunker_after = cur.fetchone()[0]
                cur.execute("SELECT count(*) FROM fx_rate_series;")
                fx_after = cur.fetchone()[0]

            self.assertEqual(freight_before, freight_after)
            self.assertEqual(bunker_before, bunker_after)
            self.assertEqual(fx_before, fx_after)

        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
