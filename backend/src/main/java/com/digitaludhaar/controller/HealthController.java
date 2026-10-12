package com.digitaludhaar.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("database", "MySQL (udhaar_db)");
        response.put("service", "Digital Udhaar Khata Java Spring Boot Engine");
        response.put("version", "2.0.0");
        return ResponseEntity.ok(response);
    }
}
