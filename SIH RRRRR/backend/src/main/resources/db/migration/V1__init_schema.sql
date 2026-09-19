-- V1__init_schema.sql
-- Exact schema matching Section 17 of si26006_architecture.md

-- 1. Roles
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Ports
CREATE TABLE ports (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    region VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION
);

-- 4. Port Constraints
CREATE TABLE port_constraints (
    id BIGSERIAL PRIMARY KEY,
    port_id BIGINT NOT NULL REFERENCES ports(id),
    max_draft_m DOUBLE PRECISION,
    max_loa_m DOUBLE PRECISION,
    max_beam_m DOUBLE PRECISION,
    berth_count INTEGER,
    handling_rate_tph DOUBLE PRECISION,
    avg_turnaround_days DOUBLE PRECISION,
    data_provenance VARCHAR(50) NOT NULL,
    source_url VARCHAR(500),
    last_verified_at TIMESTAMP WITH TIME ZONE
);

-- 5. Vessel Classes
CREATE TABLE vessel_classes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    dwt_min DOUBLE PRECISION,
    dwt_max DOUBLE PRECISION,
    typical_draft_m DOUBLE PRECISION,
    typical_loa_m DOUBLE PRECISION,
    typical_beam_m DOUBLE PRECISION
);

-- 6. Vessels
CREATE TABLE vessels (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    vessel_class_id BIGINT NOT NULL REFERENCES vessel_classes(id),
    dwt DOUBLE PRECISION,
    draft_m DOUBLE PRECISION,
    loa_m DOUBLE PRECISION,
    beam_m DOUBLE PRECISION
);

-- 7. Routes
CREATE TABLE routes (
    id BIGSERIAL PRIMARY KEY,
    origin_region VARCHAR(100) NOT NULL,
    destination_port_id BIGINT NOT NULL REFERENCES ports(id),
    distance_nm DOUBLE PRECISION NOT NULL,
    typical_transit_days DOUBLE PRECISION NOT NULL
);

-- 8. Freight Index Series
CREATE TABLE freight_index_series (
    id BIGSERIAL PRIMARY KEY,
    index_name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    data_provenance VARCHAR(50) NOT NULL,
    source VARCHAR(255) NOT NULL
);

-- 9. Bunker Price Series
CREATE TABLE bunker_price_series (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    data_provenance VARCHAR(50) NOT NULL,
    source VARCHAR(255) NOT NULL
);

-- 10. FX Rate Series
CREATE TABLE fx_rate_series (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    pair VARCHAR(20) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    data_provenance VARCHAR(50) NOT NULL,
    source VARCHAR(255) NOT NULL
);

-- 11. Congestion Series
CREATE TABLE congestion_series (
    id BIGSERIAL PRIMARY KEY,
    port_id BIGINT NOT NULL REFERENCES ports(id),
    date DATE NOT NULL,
    congestion_score DOUBLE PRECISION NOT NULL,
    data_provenance VARCHAR(50) NOT NULL
);

-- 12. Weather Risk Calendar
CREATE TABLE weather_risk_calendar (
    id BIGSERIAL PRIMARY KEY,
    region VARCHAR(100) NOT NULL,
    month INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    note VARCHAR(500)
);

-- 13. Cargo Requests
CREATE TABLE cargo_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    tonnage DOUBLE PRECISION NOT NULL,
    origin_region VARCHAR(100) NOT NULL,
    destination_port_id BIGINT NOT NULL REFERENCES ports(id),
    deadline DATE NOT NULL,
    contract_preference VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL
);

-- 14. Forecast Runs
CREATE TABLE forecast_runs (
    id BIGSERIAL PRIMARY KEY,
    cargo_request_id BIGINT REFERENCES cargo_requests(id),
    route_id BIGINT NOT NULL REFERENCES routes(id),
    vessel_class_id BIGINT NOT NULL REFERENCES vessel_classes(id),
    model_used VARCHAR(100) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Forecast Results
CREATE TABLE forecast_results (
    id BIGSERIAL PRIMARY KEY,
    forecast_run_id BIGINT NOT NULL REFERENCES forecast_runs(id),
    expected_value DOUBLE PRECISION NOT NULL,
    interval_50_low DOUBLE PRECISION,
    interval_50_high DOUBLE PRECISION,
    interval_90_low DOUBLE PRECISION,
    interval_90_high DOUBLE PRECISION,
    prob_increase_pct DOUBLE PRECISION,
    confidence_score DOUBLE PRECISION,
    data_provenance_json TEXT
);

-- 16. Vessel Rankings
CREATE TABLE vessel_rankings (
    id BIGSERIAL PRIMARY KEY,
    forecast_run_id BIGINT NOT NULL REFERENCES forecast_runs(id),
    vessel_class_id BIGINT NOT NULL REFERENCES vessel_classes(id),
    score DOUBLE PRECISION,
    estimated_landed_cost DOUBLE PRECISION,
    expected_delay_days DOUBLE PRECISION,
    feasible BOOLEAN NOT NULL,
    infeasibility_reason VARCHAR(500)
);

-- 17. Risk Events
CREATE TABLE risk_events (
    id BIGSERIAL PRIMARY KEY,
    cargo_request_id BIGINT NOT NULL REFERENCES cargo_requests(id),
    risk_score DOUBLE PRECISION NOT NULL,
    category VARCHAR(50) NOT NULL,
    top_drivers_json TEXT,
    mitigation_suggestion TEXT,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Recommendations
CREATE TABLE recommendations (
    id BIGSERIAL PRIMARY KEY,
    cargo_request_id BIGINT NOT NULL REFERENCES cargo_requests(id),
    action VARCHAR(50) NOT NULL,
    split_pct DOUBLE PRECISION,
    rationale_json TEXT,
    forecast_run_id BIGINT REFERENCES forecast_runs(id),
    risk_event_id BIGINT REFERENCES risk_events(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Scenarios
CREATE TABLE scenarios (
    id BIGSERIAL PRIMARY KEY,
    cargo_request_id BIGINT NOT NULL REFERENCES cargo_requests(id),
    input_perturbation_json TEXT,
    resulting_recommendation_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Contracts
CREATE TABLE contracts (
    id BIGSERIAL PRIMARY KEY,
    cargo_request_id BIGINT REFERENCES cargo_requests(id),
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('spot', 'short', 'medium')),
    tonnage DOUBLE PRECISION NOT NULL,
    fixed_rate DOUBLE PRECISION NOT NULL,
    fixed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL
);

-- 21. Voyages
CREATE TABLE voyages (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES contracts(id),
    vessel_id BIGINT NOT NULL REFERENCES vessels(id),
    eta_estimate TIMESTAMP WITH TIME ZONE,
    eta_actual TIMESTAMP WITH TIME ZONE,
    demurrage_actual DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL
);

-- 22. Audit Logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    payload_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Required Indexes (§17)
CREATE INDEX idx_congestion_port_date ON congestion_series(port_id, date);
CREATE INDEX idx_forecast_runs_lookup ON forecast_runs(route_id, vessel_class_id, generated_at);
CREATE INDEX idx_cargo_requests_user_status ON cargo_requests(user_id, status);
