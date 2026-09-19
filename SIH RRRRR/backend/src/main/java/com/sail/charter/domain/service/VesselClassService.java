package com.sail.charter.domain.service;

import com.sail.charter.api.dto.VesselClassDto;
import com.sail.charter.domain.entity.VesselClass;
import com.sail.charter.domain.repository.VesselClassRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class VesselClassService {

    private final VesselClassRepository vesselClassRepository;

    public VesselClassService(VesselClassRepository vesselClassRepository) {
        this.vesselClassRepository = vesselClassRepository;
    }

    public List<VesselClassDto> getAllVesselClasses() {
        return vesselClassRepository.findAll().stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    private VesselClassDto mapToDto(VesselClass vc) {
        return new VesselClassDto(
            vc.getId(),
            vc.getName(),
            vc.getDwtMin(),
            vc.getDwtMax(),
            vc.getTypicalDraftM(),
            vc.getTypicalLoaM(),
            vc.getTypicalBeamM()
        );
    }
}
