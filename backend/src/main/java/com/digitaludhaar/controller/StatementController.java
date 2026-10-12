package com.digitaludhaar.controller;

import com.digitaludhaar.security.UserDetailsImpl;
import com.digitaludhaar.service.PdfStatementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/statements")
@RequiredArgsConstructor
public class StatementController {

    private final PdfStatementService pdfStatementService;

    @GetMapping("/customer/{customerId}/pdf")
    public ResponseEntity<byte[]> downloadCustomerStatement(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long customerId) {
        byte[] pdfBytes = pdfStatementService.generateCustomerStatementPdf(userDetails.getId(), customerId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "Customer_Ledger_Statement_" + customerId + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
