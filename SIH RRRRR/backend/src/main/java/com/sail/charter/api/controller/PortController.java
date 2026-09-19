package com.sail.charter.api.controller;

import com.sail.charter.api.dto.PortDto;
import com.sail.charter.domain.service.PortService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ports")
public class PortController {

    private final PortService portService;

    public PortController(PortService portService) {
        this.portService = portService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VIEWER', 'ANALYST', 'MANAGER', 'ADMIN')")
    public ResponseEntity<java.util.List<PortDto>> getAllPorts() {
        return ResponseEntity.ok(portService.getAllPorts());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VIEWER', 'ANALYST', 'MANAGER', 'ADMIN')")
    public ResponseEntity<PortDto> getPortById(@PathVariable Long id) {
        PortDto portDto = portService.getPortById(id);
        return ResponseEntity.ok(portDto);
    }
}
