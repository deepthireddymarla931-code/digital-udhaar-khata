package com.digitaludhaar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CustomerDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerRequest {
        @NotBlank(message = "Customer name is required")
        private String name;

        @NotBlank(message = "Phone number is required")
        private String phone;

        private String email;
        private String address;

        @NotNull(message = "Credit limit is required")
        private BigDecimal creditLimit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CustomerResponse {
        private Long id;
        private String name;
        private String phone;
        private String email;
        private String address;
        private BigDecimal creditLimit;
        private String riskLevel; // LOW, MEDIUM, HIGH
        private BigDecimal netBalance; // positive = customer owes (GIVE > RECEIVE), negative = advance (RECEIVE > GIVE)
        private BigDecimal totalGiven;
        private BigDecimal totalReceived;
        private String status; // OWES, ADVANCE, SETTLED
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
