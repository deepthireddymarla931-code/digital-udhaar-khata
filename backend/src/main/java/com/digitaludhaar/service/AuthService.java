package com.digitaludhaar.service;

import com.digitaludhaar.dto.AuthDTOs.*;
import com.digitaludhaar.model.AuditLog;
import com.digitaludhaar.model.Merchant;
import com.digitaludhaar.repository.AuditLogRepository;
import com.digitaludhaar.repository.MerchantRepository;
import com.digitaludhaar.security.JwtUtils;
import com.digitaludhaar.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MerchantRepository merchantRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (merchantRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Error: Email is already registered!");
        }

        if (merchantRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Error: Phone number is already registered!");
        }

        Merchant merchant = Merchant.builder()
                .name(request.getName())
                .shopName(request.getShopName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_MERCHANT")
                .build();

        Merchant savedMerchant = merchantRepository.save(merchant);

        auditLogRepository.save(AuditLog.builder()
                .merchantId(savedMerchant.getId())
                .action("MERCHANT_REGISTERED")
                .details("Registered merchant: " + savedMerchant.getShopName())
                .build());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        return AuthResponse.builder()
                .token(jwt)
                .merchantId(savedMerchant.getId())
                .name(savedMerchant.getName())
                .shopName(savedMerchant.getShopName())
                .email(savedMerchant.getEmail())
                .phone(savedMerchant.getPhone())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        auditLogRepository.save(AuditLog.builder()
                .merchantId(userDetails.getId())
                .action("MERCHANT_LOGIN")
                .details("Logged in merchant: " + userDetails.getShopName())
                .build());

        return AuthResponse.builder()
                .token(jwt)
                .merchantId(userDetails.getId())
                .name(userDetails.getName())
                .shopName(userDetails.getShopName())
                .email(userDetails.getEmail())
                .phone("")
                .build();
    }
}
