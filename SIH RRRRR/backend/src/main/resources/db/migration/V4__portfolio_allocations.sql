-- V4: Charter Portfolio Allocations table (Task 19 / §13)
-- Stores mean-variance portfolio optimisation results per cargo request.
-- Next migration: V5__...sql

CREATE TABLE IF NOT EXISTS portfolio_allocations (
    id                      BIGSERIAL PRIMARY KEY,
    cargo_request_id        BIGINT NOT NULL REFERENCES cargo_requests(id) ON DELETE CASCADE,
    risk_aversion_lambda    DOUBLE PRECISION NOT NULL,
    lambda_label            VARCHAR(20) NOT NULL,
    spot_pct                DOUBLE PRECISION NOT NULL,
    short_term_pct          DOUBLE PRECISION NOT NULL,
    medium_term_pct         DOUBLE PRECISION NOT NULL,
    total_expected_cost_usd DOUBLE PRECISION NOT NULL,
    portfolio_variance      DOUBLE PRECISION NOT NULL,
    objective_value         DOUBLE PRECISION NOT NULL,
    solver_used             VARCHAR(50) NOT NULL,
    allocations_json        TEXT,
    assumptions_json        TEXT,
    disclaimer              TEXT,
    data_provenance_json    TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_alloc_cargo_id
    ON portfolio_allocations(cargo_request_id);
