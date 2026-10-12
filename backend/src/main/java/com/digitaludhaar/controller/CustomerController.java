package com.digitaludhaar.controller;

import com.digitaludhaar.dto.CustomerDTO.*;
import com.digitaludhaar.security.UserDetailsImpl;
import com.digitaludhaar.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(customerService.createCustomer(userDetails.getId(), request));
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> getAllCustomers(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(customerService.getAllCustomersByMerchant(userDetails.getId(), search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomerById(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(userDetails.getId(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(customerService.updateCustomer(userDetails.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomer(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        customerService.deleteCustomer(userDetails.getId(), id);
        return ResponseEntity.ok().body("Customer deleted successfully");
    }
}
