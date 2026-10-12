package com.digitaludhaar.controller;

import com.digitaludhaar.dto.DashboardSummaryDTO;
import com.digitaludhaar.dto.TransactionDTO.*;
import com.digitaludhaar.security.UserDetailsImpl;
import com.digitaludhaar.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponse> addTransaction(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.addTransaction(userDetails.getId(), request));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<TransactionResponse>> getCustomerTransactions(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long customerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByCustomer(userDetails.getId(), customerId));
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAllTransactions(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(transactionService.getAllMerchantTransactions(userDetails.getId()));
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(transactionService.getDashboardSummary(userDetails.getId()));
    }
}
