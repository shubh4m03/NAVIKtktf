package com.sail.charter.api.controller;

import com.sail.charter.domain.service.NirnayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/nirnay")
public class NirnayController {

    private final NirnayService nirnayService;

    public NirnayController(NirnayService nirnayService) {
        this.nirnayService = nirnayService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> request) {
        String prompt = (String) request.get("prompt");
        Map<String, Object> context = (Map<String, Object>) request.get("context");
        List<Object> history = (List<Object>) request.get("history");

        if (prompt == null || prompt.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Prompt is required"));
        }

        try {
            Map<String, Object> response = nirnayService.analyze(prompt, context, history);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                    "objective", "System Error",
                    "answer", "An error occurred while contacting the AI service: " + e.getMessage(),
                    "confidence", 0.0
            ));
        }
    }
}
