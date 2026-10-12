package com.digitaludhaar.service;

import com.digitaludhaar.dto.DashboardSummaryDTO;
import com.digitaludhaar.dto.TransactionDTO.*;
import com.digitaludhaar.model.*;
import com.digitaludhaar.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CustomerRepository customerRepository;
    private final MerchantRepository merchantRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    public TransactionResponse addTransaction(Long merchantId, TransactionRequest request) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new RuntimeException("Merchant not found"));

        Customer customer = customerRepository.findByIdAndMerchantId(request.getCustomerId(), merchantId)
                .orElseThrow(() -> new RuntimeException("Customer not found or does not belong to this merchant"));

        Transaction transaction = Transaction.builder()
                .merchant(merchant)
                .customer(customer)
                .amount(request.getAmount())
                .type(request.getType())
                .paymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : PaymentMode.CASH)
                .note(request.getNote())
                .receiptUrl(request.getReceiptUrl())
                .transactionDate(request.getTransactionDate() != null ? request.getTransactionDate() : LocalDateTime.now())
                .build();

        Transaction saved = transactionRepository.save(transaction);

        auditLogRepository.save(AuditLog.builder()
                .merchantId(merchantId)
                .action("TRANSACTION_ADDED")
                .details(request.getType() + " of ₹" + request.getAmount() + " for customer " + customer.getName())
                .build());

        return mapToResponse(saved);
    }

    public List<TransactionResponse> getTransactionsByCustomer(Long merchantId, Long customerId) {
        // Validate customer belongs to merchant
        customerRepository.findByIdAndMerchantId(customerId, merchantId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        List<Transaction> transactions = transactionRepository.findByCustomerIdOrderByTransactionDateDesc(customerId);
        return transactions.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<TransactionResponse> getAllMerchantTransactions(Long merchantId) {
        List<Transaction> transactions = transactionRepository.findByMerchantIdOrderByTransactionDateDesc(merchantId);
        return transactions.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public DashboardSummaryDTO getDashboardSummary(Long merchantId) {
        BigDecimal totalGiven = transactionRepository.sumAmountByMerchantIdAndType(merchantId, TransactionType.GIVE);
        BigDecimal totalReceived = transactionRepository.sumAmountByMerchantIdAndType(merchantId, TransactionType.RECEIVE);

        if (totalGiven == null) totalGiven = BigDecimal.ZERO;
        if (totalReceived == null) totalReceived = BigDecimal.ZERO;

        BigDecimal totalOutstanding = totalGiven.subtract(totalReceived);
        if (totalOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            totalOutstanding = BigDecimal.ZERO;
        }

        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        BigDecimal collectedToday = transactionRepository.sumAmountByMerchantIdAndTypeAndDateRange(
                merchantId, TransactionType.RECEIVE, startOfDay, endOfDay);
        if (collectedToday == null) collectedToday = BigDecimal.ZERO;

        BigDecimal givenToday = transactionRepository.sumAmountByMerchantIdAndTypeAndDateRange(
                merchantId, TransactionType.GIVE, startOfDay, endOfDay);
        if (givenToday == null) givenToday = BigDecimal.ZERO;

        List<Customer> customers = customerRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        long activeDebtorsCount = customers.stream().filter(c -> {
            BigDecimal given = transactionRepository.sumAmountByCustomerIdAndType(c.getId(), TransactionType.GIVE);
            BigDecimal rec = transactionRepository.sumAmountByCustomerIdAndType(c.getId(), TransactionType.RECEIVE);
            if (given == null) given = BigDecimal.ZERO;
            if (rec == null) rec = BigDecimal.ZERO;
            return given.subtract(rec).compareTo(BigDecimal.ZERO) > 0;
        }).count();

        List<Transaction> recentTop10 = transactionRepository.findTop10ByMerchantIdOrderByTransactionDateDesc(merchantId);
        List<TransactionResponse> recentResponses = recentTop10.stream().map(this::mapToResponse).collect(Collectors.toList());

        return DashboardSummaryDTO.builder()
                .totalOutstandingCredit(totalOutstanding)
                .totalCollectedToday(collectedToday)
                .totalGivenToday(givenToday)
                .activeDebtorsCount(activeDebtorsCount)
                .totalCustomersCount(customers.size())
                .recentTransactions(recentResponses)
                .build();
    }

    private TransactionResponse mapToResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .customerId(t.getCustomer().getId())
                .customerName(t.getCustomer().getName())
                .customerPhone(t.getCustomer().getPhone())
                .amount(t.getAmount())
                .type(t.getType())
                .paymentMode(t.getPaymentMode())
                .note(t.getNote())
                .receiptUrl(t.getReceiptUrl())
                .transactionDate(t.getTransactionDate())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
