package com.sail.charter.domain.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class NirnayService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Inject Repositories here when needed to ground the context (e.g. VesselRepository)

    public NirnayService(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> analyze(String prompt, Map<String, Object> context, List<Object> history) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Map.of(
                    "objective", "Configuration Error",
                    "answer", "GEMINI_API_KEY is not configured on the server. Please set it to enable NIRNAY.",
                    "confidence", 0.0
            );
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        // Construct grounded context
        String systemInstruction = "You are NIRNAY, a maritime intelligence and freight decision-support AI. " +
                "Use the provided context to answer the user's query accurately. Do not invent vessel data or rates. " +
                "If data is not provided, state that you do not have it.";
                
        String fullPrompt = "Context Data: " + (context != null ? context.toString() : "None") + "\n\nUser Query: " + prompt;

        try {
            Map<String, Object> requestBody = Map.of(
                    "system_instruction", Map.of("parts", List.of(Map.of("text", systemInstruction))),
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", fullPrompt)))
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            
            // Parse Gemini response
            String text = "Could not parse response.";
            try {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        text = (String) parts.get(0).get("text");
                    }
                }
            } catch (Exception e) {
                // Keep default text
            }

            return Map.of(
                    "objective", "Scenario Analysis",
                    "answer", text,
                    "confidence", 0.95
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to call LLM API: " + e.getMessage(), e);
        }
    }
}
