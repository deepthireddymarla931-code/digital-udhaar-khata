package com.digitaludhaar.service;

import com.digitaludhaar.dto.CustomerDTO.CustomerResponse;
import com.digitaludhaar.dto.TransactionDTO.TransactionResponse;
import com.digitaludhaar.model.Merchant;
import com.digitaludhaar.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PdfStatementService {

    private final CustomerService customerService;
    private final TransactionService transactionService;
    private final MerchantRepository merchantRepository;

    public byte[] generateCustomerStatementPdf(Long merchantId, Long customerId) {
        CustomerResponse customer = customerService.getCustomerById(merchantId, customerId);
        List<TransactionResponse> transactions = transactionService.getTransactionsByCustomer(merchantId, customerId);
        Merchant merchant = merchantRepository.findById(merchantId).orElse(null);

        String shopName = merchant != null ? merchant.getShopName() : "Digital Udhaar Khata";

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                // Document Header Title
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 20);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 750);
                contentStream.showText(shopName + " - Customer Ledger");
                contentStream.endText();

                // Subtitle / Date
                contentStream.setFont(PDType1Font.HELVETICA, 10);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 735);
                contentStream.showText("Statement Generated on: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm")));
                contentStream.endText();

                // Divider Line
                contentStream.setLineWidth(1f);
                contentStream.moveTo(50, 725);
                contentStream.lineTo(550, 725);
                contentStream.stroke();

                // Customer Info Section
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 12);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 700);
                contentStream.showText("Customer Details:");
                contentStream.endText();

                contentStream.setFont(PDType1Font.HELVETICA, 11);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 685);
                contentStream.showText("Name: " + customer.getName() + " | Phone: " + customer.getPhone());
                contentStream.endText();

                contentStream.beginText();
                contentStream.newLineAtOffset(50, 670);
                contentStream.showText("Credit Limit: INR " + customer.getCreditLimit() + " | Risk Rating: " + customer.getRiskLevel());
                contentStream.endText();

                // Net Balance Display Box
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 13);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 645);
                String balanceText = customer.getNetBalance().compareTo(BigDecimal.ZERO) >= 0 ?
                        "NET OUTSTANDING BALANCE (OWED TO SHOP): INR " + customer.getNetBalance() :
                        "ADVANCE BALANCE (PAID AHEAD): INR " + customer.getNetBalance().abs();
                contentStream.showText(balanceText);
                contentStream.endText();

                // Table Header
                int yPosition = 610;
                contentStream.setFont(PDType1Font.HELVETICA_BOLD, 10);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, yPosition);
                contentStream.showText("Date");
                contentStream.newLineAtOffset(100, 0);
                contentStream.showText("Type");
                contentStream.newLineAtOffset(80, 0);
                contentStream.showText("Mode");
                contentStream.newLineAtOffset(90, 0);
                contentStream.showText("Amount (INR)");
                contentStream.newLineAtOffset(100, 0);
                contentStream.showText("Note");
                contentStream.endText();

                contentStream.moveTo(50, yPosition - 5);
                contentStream.lineTo(550, yPosition - 5);
                contentStream.stroke();

                yPosition -= 20;

                // Table Rows
                contentStream.setFont(PDType1Font.HELVETICA, 9);
                DateTimeFormatter dtFormatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

                for (TransactionResponse tx : transactions) {
                    if (yPosition < 50) break; // Simple page overflow guard

                    String dateStr = tx.getTransactionDate() != null ? tx.getTransactionDate().format(dtFormatter) : "N/A";
                    String typeStr = tx.getType() != null ? tx.getType().name() : "";
                    String modeStr = tx.getPaymentMode() != null ? tx.getPaymentMode().name() : "";
                    String amountStr = String.format("%.2f", tx.getAmount());
                    String noteStr = tx.getNote() != null ? (tx.getNote().length() > 20 ? tx.getNote().substring(0, 18) + ".." : tx.getNote()) : "-";

                    contentStream.beginText();
                    contentStream.newLineAtOffset(50, yPosition);
                    contentStream.showText(dateStr);
                    contentStream.newLineAtOffset(100, 0);
                    contentStream.showText(typeStr);
                    contentStream.newLineAtOffset(80, 0);
                    contentStream.showText(modeStr);
                    contentStream.newLineAtOffset(90, 0);
                    contentStream.showText(amountStr);
                    contentStream.newLineAtOffset(100, 0);
                    contentStream.showText(noteStr);
                    contentStream.endText();

                    yPosition -= 15;
                }

                // Footer
                contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 9);
                contentStream.beginText();
                contentStream.newLineAtOffset(50, 30);
                contentStream.showText("Thank you for your business! Generated by Digital Udhaar Khata System.");
                contentStream.endText();
            }

            document.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF statement: " + e.getMessage(), e);
        }
    }
}
