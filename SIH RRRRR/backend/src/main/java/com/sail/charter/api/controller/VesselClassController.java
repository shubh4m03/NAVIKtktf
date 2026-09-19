package com.sail.charter.api.controller;

import com.sail.charter.api.dto.VesselClassDto;
import com.sail.charter.domain.service.VesselClassService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vessel-classes")
public class VesselClassController {

    private final VesselClassService vesselClassService;

    public VesselClassController(VesselClassService vesselClassService) {
        this.vesselClassService = vesselClassService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VIEWER', 'ANALYST', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<VesselClassDto>> getAllVesselClasses() {
        List<VesselClassDto> vesselClasses = vesselClassService.getAllVesselClasses();
        return ResponseEntity.ok(vesselClasses);
    }
}
