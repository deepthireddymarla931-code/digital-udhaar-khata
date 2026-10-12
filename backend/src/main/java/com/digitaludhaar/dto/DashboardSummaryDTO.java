package com.digitaludhaar.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryDTO {
    private BigDecimal totalOutstandingCredit; // Total money customers owe merchant
    private BigDecimal totalCollectedToday;     // Total RECEIVE payments today
    private BigDecimal totalGivenToday;         // Total GIVE entries today
    private long activeDebtorsCount;            // Customers with net balance > 0
    private long totalCustomersCount;           // Total customers registered
    private List<TransactionDTO.TransactionResponse> recentTransactions;
}
