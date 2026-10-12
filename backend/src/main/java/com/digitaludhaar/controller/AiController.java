package com.digitaludhaar.controller;

import com.digitaludhaar.dto.AiDTOs.*;
import com.digitaludhaar.security.UserDetailsImpl;
import com.digitaludhaar.service.AiIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiIntegrationService aiIntegrationService;

    @PostMapping("/parse-nlp")
    public ResponseEntity<NlpParseResponse> parseNaturalLanguage(
            @RequestBody NlpParseRequest request) {
        return ResponseEntity.ok(aiIntegrationService.parseNaturalLanguageTransaction(request.getPrompt()));
    }

    @PostMapping("/generate-reminder")
    public ResponseEntity<ReminderResponse> generateReminder(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody ReminderRequest request) {
        return ResponseEntity.ok(aiIntegrationService.generatePaymentReminder(userDetails.getId(), request));
    }

    @GetMapping("/risk-assessment/{customerId}")
    public ResponseEntity<RiskAnalysisResponse> getRiskAssessment(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long customerId) {
        return ResponseEntity.ok(aiIntegrationService.assessCreditRisk(userDetails.getId(), customerId));
    }

    @GetMapping("/cashflow-insights")
    public ResponseEntity<CashflowInsightResponse> getCashflowInsights(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(aiIntegrationService.getCashflowInsights(userDetails.getId()));
    }
}
