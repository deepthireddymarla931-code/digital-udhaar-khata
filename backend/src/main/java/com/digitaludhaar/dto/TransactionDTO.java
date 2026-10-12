package com.digitaludhaar.dto;

import com.digitaludhaar.model.PaymentMode;
import com.digitaludhaar.model.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionRequest {
        @NotNull(message = "Customer ID is required")
        private Long customerId;

        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be positive")
        private BigDecimal amount;

        @NotNull(message = "Transaction type (GIVE or RECEIVE) is required")
        private TransactionType type;

        private PaymentMode paymentMode = PaymentMode.CASH;
        private String note;
        private String receiptUrl;
        private LocalDateTime transactionDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionResponse {
        private Long id;
        private Long customerId;
        private String customerName;
        private String customerPhone;
        private BigDecimal amount;
        private TransactionType type;
        private PaymentMode paymentMode;
        private String note;
        private String receiptUrl;
        private LocalDateTime transactionDate;
        private LocalDateTime createdAt;
    }
}
