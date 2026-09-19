package com.sail.charter.domain.service;

import com.sail.charter.api.dto.PortConstraintDto;
import com.sail.charter.api.dto.PortDto;
import com.sail.charter.api.exception.ResourceNotFoundException;
import com.sail.charter.domain.entity.Port;
import com.sail.charter.domain.entity.PortConstraint;
import com.sail.charter.domain.repository.PortConstraintRepository;
import com.sail.charter.domain.repository.PortRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PortService {

    private final PortRepository portRepository;
    private final PortConstraintRepository portConstraintRepository;

    public PortService(PortRepository portRepository, PortConstraintRepository portConstraintRepository) {
        this.portRepository = portRepository;
        this.portConstraintRepository = portConstraintRepository;
    }

    public List<PortDto> getAllPorts() {
        List<Port> ports = portRepository.findAll();
        return ports.stream().map(port -> {
            List<PortConstraint> constraints = portConstraintRepository.findByPortId(port.getId());
            List<PortConstraintDto> constraintDtos = constraints.stream()
                .map(this::mapConstraintToDto)
                .collect(Collectors.toList());
            return new PortDto(
                port.getId(),
                port.getName(),
                port.getCode(),
                port.getRegion(),
                port.getLat(),
                port.getLon(),
                constraintDtos
            );
        }).collect(Collectors.toList());
    }

    public PortDto getPortById(Long id) {
        Port port = portRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Port not found with id: " + id));

        List<PortConstraint> constraints = portConstraintRepository.findByPortId(id);
        List<PortConstraintDto> constraintDtos = constraints.stream()
            .map(this::mapConstraintToDto)
            .collect(Collectors.toList());

        return new PortDto(
            port.getId(),
            port.getName(),
            port.getCode(),
            port.getRegion(),
            port.getLat(),
            port.getLon(),
            constraintDtos
        );
    }

    private PortConstraintDto mapConstraintToDto(PortConstraint pc) {
        return new PortConstraintDto(
            pc.getId(),
            pc.getMaxDraftM(),
            pc.getMaxLoaM(),
            pc.getMaxBeamM(),
            pc.getBerthCount(),
            pc.getHandlingRateTph(),
            pc.getAvgTurnaroundDays(),
            pc.getDataProvenance(),
            pc.getSourceUrl(),
            pc.getLastVerifiedAt()
        );
    }
}
