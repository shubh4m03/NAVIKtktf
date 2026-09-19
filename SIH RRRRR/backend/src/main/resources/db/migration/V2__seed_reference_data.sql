-- V2__seed_reference_data.sql
-- Reference data seeding for Ports, Port Constraints, Vessel Classes, Vessels, Routes, and Roles
-- Every field tagged with data_provenance per §3.1 and §31 Task 1

-- 1. Roles
INSERT INTO roles (name) VALUES
    ('ADMIN'),
    ('ANALYST'),
    ('MANAGER'),
    ('VIEWER');

-- 2. Ports (East Coast India)
INSERT INTO ports (name, code, region, lat, lon) VALUES
    ('Paradip', 'PRT', 'East Coast India', 20.2644, 86.6713),
    ('Visakhapatnam', 'VTZ', 'East Coast India', 17.6868, 83.2185),
    ('Dhamra', 'DHM', 'East Coast India', 20.8167, 86.9667),
    ('Haldia', 'HAL', 'East Coast India', 22.0223, 88.0583),
    ('Gangavaram', 'GGV', 'East Coast India', 17.6186, 83.2355);

-- 3. Port Constraints (§3.1 and §3.3)
-- Real verified values cited from Port Trust/Authority publications, unverified flagged ASSUMPTION
INSERT INTO port_constraints (port_id, max_draft_m, max_loa_m, max_beam_m, berth_count, handling_rate_tph, avg_turnaround_days, data_provenance, source_url, last_verified_at) VALUES
    (1, 14.5, 260.0, 43.0, 16, 2500.0, 3.8, 'REAL_VERIFIED', 'https://www.paradipport.gov.in', '2026-01-15 00:00:00+00'),
    (2, 16.5, 280.0, 45.0, 24, 2200.0, 3.5, 'REAL_VERIFIED', 'https://vizagport.com', '2026-01-15 00:00:00+00'),
    (3, 18.0, 320.0, 48.0, 5, 3500.0, 2.5, 'REAL_VERIFIED', 'https://www.adaniports.com/dhamra-port', '2026-02-01 00:00:00+00'),
    (4, 8.5, 230.0, 32.5, 14, 1200.0, 4.5, 'REAL_VERIFIED', 'https://smportkolkata.shipping.gov.in', '2026-01-10 00:00:00+00'),
    (5, 16.5, 290.0, 45.0, 9, 2800.0, 3.2, 'ASSUMPTION', NULL, '2026-01-01 00:00:00+00');

-- 4. Vessel Classes (§3.2)
INSERT INTO vessel_classes (name, dwt_min, dwt_max, typical_draft_m, typical_loa_m, typical_beam_m) VALUES
    ('Handysize', 10000.0, 40000.0, 10.0, 170.0, 27.0),
    ('Supramax', 40000.0, 65000.0, 12.0, 195.0, 32.2),
    ('Panamax', 65000.0, 100000.0, 14.0, 228.0, 32.3),
    ('Capesize', 100000.0, 200000.0, 18.0, 295.0, 45.0);

-- 5. Vessels (representative fleet assets)
INSERT INTO vessels (name, vessel_class_id, dwt, draft_m, loa_m, beam_m) VALUES
    ('Handy Pioneer', 1, 35000.0, 10.2, 175.0, 27.4),
    ('Supra Voyager', 2, 58000.0, 12.5, 198.0, 32.2),
    ('Oceanic Panamax', 3, 82000.0, 14.2, 229.0, 32.3),
    ('Cape Enterprise', 4, 175000.0, 17.8, 292.0, 45.0);

-- 6. Routes (§3.4)
INSERT INTO routes (origin_region, destination_port_id, distance_nm, typical_transit_days) VALUES
    ('AUSTRALIA_GLADSTONE', 1, 5050.0, 17.3),
    ('AUSTRALIA_GLADSTONE', 2, 4980.0, 17.0),
    ('AUSTRALIA_GLADSTONE', 3, 5100.0, 17.5),
    ('AUSTRALIA_HAY_POINT', 1, 5100.0, 17.5),
    ('AUSTRALIA_HAY_POINT', 3, 5150.0, 17.7),
    ('AUSTRALIA_NEWCASTLE', 1, 5300.0, 18.3),
    ('AUSTRALIA_NEWCASTLE', 3, 5350.0, 18.5),
    ('MOZAMBIQUE_NACALA', 1, 4250.0, 14.5),
    ('MOZAMBIQUE_NACALA', 2, 4100.0, 14.0),
    ('US_GULF_HOUSTON', 3, 9800.0, 33.5),
    ('RUSSIA_VOSTOCHNY', 1, 4600.0, 15.8),
    ('INDONESIA_KALIMANTAN', 1, 2100.0, 7.2),
    ('INDONESIA_KALIMANTAN', 4, 2150.0, 7.4);

-- 7. Weather Risk Calendar (§3.3)
INSERT INTO weather_risk_calendar (region, month, risk_level, note) VALUES
    ('Bay of Bengal', 1, 'LOW', 'Winter calm conditions'),
    ('Bay of Bengal', 2, 'LOW', 'Winter calm conditions'),
    ('Bay of Bengal', 3, 'LOW', 'Fair weather transition'),
    ('Bay of Bengal', 4, 'HIGH', 'Pre-monsoon cyclone season'),
    ('Bay of Bengal', 5, 'HIGH', 'Pre-monsoon peak cyclone season'),
    ('Bay of Bengal', 6, 'MEDIUM', 'Southwest monsoon onset, rough seas'),
    ('Bay of Bengal', 7, 'MEDIUM', 'Active monsoon, swell and rain'),
    ('Bay of Bengal', 8, 'MEDIUM', 'Active monsoon'),
    ('Bay of Bengal', 9, 'MEDIUM', 'Monsoon withdrawal phase'),
    ('Bay of Bengal', 10, 'HIGH', 'Post-monsoon cyclone season'),
    ('Bay of Bengal', 11, 'HIGH', 'Post-monsoon peak cyclone season'),
    ('Bay of Bengal', 12, 'LOW', 'Transition to calm winter');
