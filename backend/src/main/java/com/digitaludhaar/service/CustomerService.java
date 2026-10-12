package com.digitaludhaar.service;

import com.digitaludhaar.dto.CustomerDTO.*;
import com.digitaludhaar.model.*;
import com.digitaludhaar.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final MerchantRepository merchantRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public CustomerResponse createCustomer(Long merchantId, CustomerRequest request) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new RuntimeException("Merchant not found"));

        customerRepository.findByMerchantIdAndPhone(merchantId, request.getPhone())
                .ifPresent(c -> {
                    throw new RuntimeException("Customer with phone number " + request.getPhone() + " already exists!");
                });

        Customer customer = Customer.builder()
                .merchant(merchant)
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .creditLimit(request.getCreditLimit() != null ? request.getCreditLimit() : new BigDecimal("10000.00"))
                .riskLevel("LOW")
                .build();

        Customer saved = customerRepository.save(customer);
        return mapToResponse(saved);
    }

    public List<CustomerResponse> getAllCustomersByMerchant(Long merchantId, String searchQuery) {
        List<Customer> customers;
        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            customers = customerRepository.searchByNameOrPhone(merchantId, searchQuery.trim());
        } else {
            customers = customerRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        }

        return customers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CustomerResponse getCustomerById(Long merchantId, Long customerId) {
        Customer customer = customerRepository.findByIdAndMerchantId(customerId, merchantId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return mapToResponse(customer);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long merchantId, Long customerId, CustomerRequest request) {
        Customer customer = customerRepository.findByIdAndMerchantId(customerId, merchantId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setAddress(request.getAddress());
        if (request.getCreditLimit() != null) {
            customer.setCreditLimit(request.getCreditLimit());
        }

        Customer updated = customerRepository.save(customer);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteCustomer(Long merchantId, Long customerId) {
        Customer customer = customerRepository.findByIdAndMerchantId(customerId, merchantId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        customerRepository.delete(customer);
    }

    public CustomerResponse mapToResponse(Customer customer) {
        BigDecimal totalGiven = transactionRepository.sumAmountByCustomerIdAndType(customer.getId(), TransactionType.GIVE);
        BigDecimal totalReceived = transactionRepository.sumAmountByCustomerIdAndType(customer.getId(), TransactionType.RECEIVE);

        if (totalGiven == null) totalGiven = BigDecimal.ZERO;
        if (totalReceived == null) totalReceived = BigDecimal.ZERO;

        // netBalance > 0 means customer owes money (GIVE > RECEIVE)
        // netBalance < 0 means customer paid in advance (RECEIVE > GIVE)
        BigDecimal netBalance = totalGiven.subtract(totalReceived);

        String status = "SETTLED";
        if (netBalance.compareTo(BigDecimal.ZERO) > 0) {
            status = "OWES";
        } else if (netBalance.compareTo(BigDecimal.ZERO) < 0) {
            status = "ADVANCE";
        }

        // Auto-calculate risk level
        String computedRisk = customer.getRiskLevel();
        if (customer.getCreditLimit() != null && customer.getCreditLimit().compareTo(BigDecimal.ZERO) > 0) {
            double usageRatio = netBalance.doubleValue() / customer.getCreditLimit().doubleValue();
            if (usageRatio > 0.85) {
                computedRisk = "HIGH";
            } else if (usageRatio > 0.50) {
                computedRisk = "MEDIUM";
            } else {
                computedRisk = "LOW";
            }
        }

        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .address(customer.getAddress())
                .creditLimit(customer.getCreditLimit())
                .riskLevel(computedRisk)
                .netBalance(netBalance)
                .totalGiven(totalGiven)
                .totalReceived(totalReceived)
                .status(status)
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
}
