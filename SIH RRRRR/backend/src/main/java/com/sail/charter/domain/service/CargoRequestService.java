package com.sail.charter.domain.service;

import com.sail.charter.api.dto.CargoRequestResponseDto;
import com.sail.charter.api.dto.CreateCargoRequestDto;
import com.sail.charter.api.exception.ResourceNotFoundException;
import com.sail.charter.domain.entity.CargoRequest;
import com.sail.charter.domain.entity.Port;
import com.sail.charter.domain.entity.Role;
import com.sail.charter.domain.entity.User;
import com.sail.charter.domain.repository.CargoRequestRepository;
import com.sail.charter.domain.repository.PortRepository;
import com.sail.charter.domain.repository.RoleRepository;
import com.sail.charter.domain.repository.UserRepository;
import com.sail.charter.api.dto.DecisionChainResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@Transactional
public class CargoRequestService {

    private final CargoRequestRepository cargoRequestRepository;
    private final PortRepository portRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CargoDecisionOrchestrator cargoDecisionOrchestrator;

    public CargoRequestService(CargoRequestRepository cargoRequestRepository,
                               PortRepository portRepository,
                               UserRepository userRepository,
                               RoleRepository roleRepository,
                               CargoDecisionOrchestrator cargoDecisionOrchestrator) {
        this.cargoRequestRepository = cargoRequestRepository;
        this.portRepository = portRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.cargoDecisionOrchestrator = cargoDecisionOrchestrator;
    }

    public DecisionChainResponseDto createAndProcessCargoRequest(CreateCargoRequestDto dto) {
        Port destinationPort = portRepository.findById(dto.getDestinationPortId())
            .orElseThrow(() -> new ResourceNotFoundException("Destination port not found with id: " + dto.getDestinationPortId()));

        User user = resolveUser(dto.getUserId());

        CargoRequest cargoRequest = new CargoRequest(
            null,
            user,
            dto.getTonnage(),
            dto.getOriginRegion(),
            destinationPort,
            dto.getDeadline(),
            dto.getContractPreference(),
            OffsetDateTime.now(),
            "PENDING"
        );

        CargoRequest saved = cargoRequestRepository.save(cargoRequest);
        return cargoDecisionOrchestrator.processCargoRequest(saved.getId());
    }

    public DecisionChainResponseDto getRecommendation(Long cargoRequestId) {
        return cargoDecisionOrchestrator.processCargoRequest(cargoRequestId);
    }

    public DecisionChainResponseDto runScenario(Long cargoRequestId, com.sail.charter.api.dto.ScenarioPerturbationDto perturbation) {
        return cargoDecisionOrchestrator.runScenario(cargoRequestId, perturbation);
    }


    public CargoRequestResponseDto createCargoRequest(CreateCargoRequestDto dto) {
        Port destinationPort = portRepository.findById(dto.getDestinationPortId())
            .orElseThrow(() -> new ResourceNotFoundException("Destination port not found with id: " + dto.getDestinationPortId()));

        User user = resolveUser(dto.getUserId());

        CargoRequest cargoRequest = new CargoRequest(
            null,
            user,
            dto.getTonnage(),
            dto.getOriginRegion(),
            destinationPort,
            dto.getDeadline(),
            dto.getContractPreference(),
            OffsetDateTime.now(),
            "PENDING"
        );

        CargoRequest saved = cargoRequestRepository.save(cargoRequest);

        return new CargoRequestResponseDto(
            saved.getId(),
            saved.getUser().getId(),
            saved.getTonnage(),
            saved.getOriginRegion(),
            saved.getDestinationPort().getId(),
            saved.getDestinationPort().getName(),
            saved.getDeadline(),
            saved.getContractPreference(),
            saved.getCreatedAt(),
            saved.getStatus()
        );
    }

    private User resolveUser(Long userId) {
        if (userId != null) {
            return userRepository.findById(userId)
                .orElseGet(this::getOrCreateDefaultUser);
        }
        return getOrCreateDefaultUser();
    }

    private User getOrCreateDefaultUser() {
        return userRepository.findByUsername("analyst_default")
            .orElseGet(() -> {
                Role analystRole = roleRepository.findByName("ANALYST")
                    .orElseGet(() -> roleRepository.save(new Role(null, "ANALYST")));
                User defaultUser = new User(
                    null,
                    "analyst_default",
                    "default_hash",
                    analystRole,
                    OffsetDateTime.now()
                );
                return userRepository.save(defaultUser);
            });
    }
}
