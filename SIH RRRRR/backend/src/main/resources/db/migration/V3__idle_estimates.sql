-- V3__idle_estimates.sql
-- TASK 18: Idle-Time & Repositioning Engine MVP Schema (§10)

CREATE TABLE idle_estimates (
    id BIGSERIAL PRIMARY KEY,
    cargo_request_id BIGINT REFERENCES cargo_requests(id),
    discharge_port_id BIGINT NOT NULL REFERENCES ports(id),
    vessel_class_id BIGINT NOT NULL REFERENCES vessel_classes(id),
    estimated_arrival_date DATE NOT NULL,
    turnaround_days DOUBLE PRECISION NOT NULL,
    available_date DATE NOT NULL,
    opportunity_lanes_json TEXT NOT NULL,
    disclaimer VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_idle_estimates_cargo_request_id ON idle_estimates(cargo_request_id);
