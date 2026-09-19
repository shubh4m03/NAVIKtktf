package com.sail.charter.domain.repository;

import com.sail.charter.domain.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ReferenceDataJpaTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PortRepository portRepository;

    @Autowired
    private PortConstraintRepository portConstraintRepository;

    @Autowired
    private VesselClassRepository vesselClassRepository;

    @Autowired
    private VesselRepository vesselRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private WeatherRiskCalendarRepository weatherRiskCalendarRepository;

    @Test
    @DisplayName("Assert seeded reference tables have row count > 0 and validate constraints")
    void testSeededReferenceTables() {
        // 1. Roles
        List<Role> roles = roleRepository.findAll();
        assertThat(roles).isNotEmpty();
        assertThat(roles).hasSizeGreaterThanOrEqualTo(4);

        // 2. Ports
        List<Port> ports = portRepository.findAll();
        assertThat(ports).isNotEmpty();
        assertThat(ports).hasSize(5);

        // 3. Port Constraints - verify non-null data_provenance on every row
        List<PortConstraint> constraints = portConstraintRepository.findAll();
        assertThat(constraints).isNotEmpty();
        assertThat(constraints).hasSize(5);
        for (PortConstraint constraint : constraints) {
            assertThat(constraint.getDataProvenance())
                .as("data_provenance must not be null for port %s", constraint.getPort().getName())
                .isNotNull();
        }

        // Verify Dhamra has REAL_VERIFIED and Gangavaram has ASSUMPTION
        assertThat(constraints)
            .filteredOn(c -> c.getPort().getCode().equals("DHM"))
            .allMatch(c -> c.getDataProvenance() == DataProvenance.REAL_VERIFIED);
        assertThat(constraints)
            .filteredOn(c -> c.getPort().getCode().equals("GGV"))
            .allMatch(c -> c.getDataProvenance() == DataProvenance.ASSUMPTION && c.getSourceUrl() == null);

        // 4. Vessel Classes
        List<VesselClass> vesselClasses = vesselClassRepository.findAll();
        assertThat(vesselClasses).isNotEmpty();
        assertThat(vesselClasses).hasSize(4);

        // 5. Vessels
        List<Vessel> vessels = vesselRepository.findAll();
        assertThat(vessels).isNotEmpty();
        assertThat(vessels).hasSize(4);

        // 6. Routes
        List<Route> routes = routeRepository.findAll();
        assertThat(routes).isNotEmpty();
        assertThat(routes).hasSize(13);

        // 7. Weather Risk Calendar
        List<WeatherRiskCalendar> calendar = weatherRiskCalendarRepository.findAll();
        assertThat(calendar).isNotEmpty();
        assertThat(calendar).hasSize(12);
    }
}
