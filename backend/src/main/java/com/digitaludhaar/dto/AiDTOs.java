package com.digitaludhaar.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

public class AiDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NlpParseRequest {
        private String prompt; // e.g. "Ramesh took 500 rupees grocery on credit"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NlpParseResponse {
        private String customerName;
        private BigDecimal amount;
        private String type; // "GIVE" or "RECEIVE"
        private String note;
        private String paymentMode;
        private boolean parsedSuccessfully;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReminderRequest {
        private Long customerId;
        private String tone; // POLITE, FIRM, URGENT
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReminderResponse {
        private String customerName;
        private String phone;
        private BigDecimal pendingAmount;
        private String generatedMessage;
        private String whatsappUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RiskAnalysisResponse {
        private Long customerId;
        private String customerName;
        private String riskLevel; // LOW, MEDIUM, HIGH
        private int riskScore; // 0 - 100
        private BigDecimal creditLimit;
        private BigDecimal currentBalance;
        private String recommendation;
        private List<String> riskFactors;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashflowInsightResponse {
        private BigDecimal totalOutstanding;
        private int totalDebtors;
        private String healthStatus; // HEALTHY, MODERATE, CRITICAL
        private String summaryText;
        private List<String> actionableAdvice;
        private String predictedCollectionTimeframe;
    }
}
