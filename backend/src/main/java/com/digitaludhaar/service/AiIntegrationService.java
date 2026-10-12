package com.digitaludhaar.service;

import com.digitaludhaar.dto.AiDTOs.*;
import com.digitaludhaar.model.Customer;
import com.digitaludhaar.model.Merchant;
import com.digitaludhaar.model.TransactionType;
import com.digitaludhaar.repository.CustomerRepository;
import com.digitaludhaar.repository.MerchantRepository;
import com.digitaludhaar.repository.TransactionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AiIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(AiIntegrationService.class);

    @Value("${ai.openai.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${ai.openai.api-key:mock_key}")
    private String apiKey;

    @Value("${ai.openai.model:gpt-3.5-turbo}")
    private String apiModel;

    private final CustomerRepository customerRepository;
    private final MerchantRepository merchantRepository;
    private final TransactionRepository transactionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Smart NLP Transaction Entry Parser
     */
    public NlpParseResponse parseNaturalLanguageTransaction(String prompt) {
        if (prompt == null || prompt.trim().isEmpty()) {
            return NlpParseResponse.builder().parsedSuccessfully(false).build();
        }

        // Try AI LLM parsing if key is set and valid
        if (apiKey != null && !apiKey.equals("mock_key") && !apiKey.isEmpty()) {
            try {
                NlpParseResponse response = parseWithLlm(prompt);
                if (response != null && response.isParsedSuccessfully()) {
                    return response;
                }
            } catch (Exception e) {
                logger.warn("LLM API call failed, falling back to smart regex parser: {}", e.getMessage());
            }
        }

        // Smart Heuristic / Pattern-matching Fallback
        return parseWithHeuristics(prompt);
    }

    private NlpParseResponse parseWithLlm(String prompt) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String systemPrompt = "You are a financial NLP parser for Indian shopkeeper ledger apps. " +
                "Extract JSON with fields: customerName (string), amount (number), type ('GIVE' for credit/udhaar/took/buy, 'RECEIVE' for paid/received/given back/settle), " +
                "note (string summary), paymentMode ('CASH', 'UPI', 'CHEQUE', 'BANK_TRANSFER'). Output ONLY valid JSON.";

        Map<String, Object> body = new HashMap<>();
        body.put("model", apiModel);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", prompt)
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            String jsonContent = root.path("choices").get(0).path("message").path("content").asText();

            jsonContent = jsonContent.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode parsed = objectMapper.readTree(jsonContent);

            return NlpParseResponse.builder()
                    .customerName(parsed.path("customerName").asText(""))
                    .amount(new BigDecimal(parsed.path("amount").asText("0")))
                    .type(parsed.path("type").asText("GIVE").toUpperCase())
                    .note(parsed.path("note").asText("Smart AI entry"))
                    .paymentMode(parsed.path("paymentMode").asText("CASH").toUpperCase())
                    .parsedSuccessfully(true)
                    .build();
        }
        return null;
    }

    private NlpParseResponse parseWithHeuristics(String prompt) {
        String lower = prompt.toLowerCase();
        
        // Default values
        String type = "GIVE";
        if (lower.contains("paid") || lower.contains("received") || lower.contains("mila") || 
            lower.contains("given back") || lower.contains("cleared") || lower.contains("settled") || lower.contains("gave back")) {
            type = "RECEIVE";
        }

        PaymentModeModeExtractor paymentModeExtractor = extractPaymentMode(lower);
        BigDecimal amount = extractAmount(prompt);
        String customerName = extractCustomerName(prompt);
        
        String note = prompt.replaceAll("(?i)\\b(\\d+)\\b", "")
                            .replaceAll("(?i)\\b(rupees|rs|inr|udhaar|credit|took|paid|gave|received|for|grocery|via|upi|cash)\\b", "")
                            .trim();
        if (note.isEmpty()) note = "General Udhaar entry";

        return NlpParseResponse.builder()
                .customerName(customerName)
                .amount(amount)
                .type(type)
                .note(note)
                .paymentMode(paymentModeExtractor.mode)
                .parsedSuccessfully(amount.compareTo(BigDecimal.ZERO) > 0)
                .build();
    }

    private PaymentModeModeExtractor extractPaymentMode(String text) {
        if (text.contains("upi") || text.contains("gpay") || text.contains("phonepe") || text.contains("paytm")) {
            return new PaymentModeModeExtractor("UPI");
        } else if (text.contains("cheque") || text.contains("check")) {
            return new PaymentModeModeExtractor("CHEQUE");
        } else if (text.contains("bank") || text.contains("transfer") || text.contains("neft")) {
            return new PaymentModeModeExtractor("BANK_TRANSFER");
        }
        return new PaymentModeModeExtractor("CASH");
    }

    private static class PaymentModeModeExtractor {
        final String mode;
        PaymentModeModeExtractor(String mode) { this.mode = mode; }
    }

    private BigDecimal extractAmount(String prompt) {
        Pattern pattern = Pattern.compile("(?i)(?:rs\\.?|inr|₹|rupees)?\\s*(\\d+(?:\\.\\d{1,2})?)\\s*(?:rs\\.?|inr|₹|rupees)?");
        Matcher matcher = pattern.matcher(prompt);
        if (matcher.find()) {
            try {
                return new BigDecimal(matcher.group(1));
            } catch (Exception e) {
                return BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }

    private String extractCustomerName(String prompt) {
        String[] words = prompt.trim().split("\\s+");
        for (String w : words) {
            String clean = w.replaceAll("[^a-zA-Z]", "");
            if (!clean.isEmpty() && Character.isUpperCase(clean.charAt(0)) &&
                !List.of("Took", "Paid", "Gave", "Rupees", "Rs", "Grocery", "Credit", "Udhaar", "UPI", "Cash").contains(clean)) {
                return clean;
            }
        }
        return words.length > 0 ? words[0].replaceAll("[^a-zA-Z0-9]", "") : "Customer";
    }

    /**
     * AI Payment Reminder Generator
     */
    public ReminderResponse generatePaymentReminder(Long merchantId, ReminderRequest request) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new RuntimeException("Merchant not found"));

        Customer customer = customerRepository.findByIdAndMerchantId(request.getCustomerId(), merchantId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        BigDecimal totalGiven = transactionRepository.sumAmountByCustomerIdAndType(customer.getId(), TransactionType.GIVE);
        BigDecimal totalReceived = transactionRepository.sumAmountByCustomerIdAndType(customer.getId(), TransactionType.RECEIVE);
        if (totalGiven == null) totalGiven = BigDecimal.ZERO;
        if (totalReceived == null) totalReceived = BigDecimal.ZERO;

        BigDecimal pendingAmount = totalGiven.subtract(totalReceived);
        if (pendingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            pendingAmount = BigDecimal.ZERO;
        }

        String tone = request.getTone() != null ? request.getTone().toUpperCase() : "POLITE";
        String message;

        switch (tone) {
            case "URGENT":
                message = String.format("URGENT REMINDER: Dear %s, your total pending balance of ₹%.2f at %s is long overdue. " +
                                "Kindly settle this amount immediately via UPI or Cash. Ignore if already paid.",
                        customer.getName(), pendingAmount, merchant.getShopName());
                break;
            case "FIRM":
                message = String.format("Dear %s, a gentle reminder that your pending balance of ₹%.2f at %s needs to be cleared. " +
                                "Please arrange payment at your earliest convenience.",
                        customer.getName(), pendingAmount, merchant.getShopName());
                break;
            case "POLITE":
            default:
                message = String.format("Namaste %s ji! Hope you are doing well. This is a polite request regarding your net pending udhaar balance of ₹%.2f at %s. " +
                                "Thank you for your business!",
                        customer.getName(), pendingAmount, merchant.getShopName());
                break;
        }

        String cleanPhone = customer.getPhone().replaceAll("[^0-9]", "");
        if (!cleanPhone.startsWith("91") && cleanPhone.length() == 10) {
            cleanPhone = "91" + cleanPhone;
        }

        String encodedMsg = URLEncoder.encode(message, StandardCharsets.UTF_8);
        String whatsappUrl = "https://wa.me/" + cleanPhone + "?text=" + encodedMsg;

        return ReminderResponse.builder()
                .customerName(customer.getName())
                .phone(customer.getPhone())
                .pendingAmount(pendingAmount)
                .generatedMessage(message)
                .whatsappUrl(whatsappUrl)
                .build();
    }

    /**
     * AI Credit Risk Scoring
     */
    public RiskAnalysisResponse assessCreditRisk(Long merchantId, Long customerId) {
        Customer customer = customerRepository.findByIdAndMerchantId(customerId, merchantId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        BigDecimal totalGiven = transactionRepository.sumAmountByCustomerIdAndType(customer.getId(), TransactionType.GIVE);
        BigDecimal totalReceived = transactionRepository.sumAmountByCustomerIdAndType(customer.getId(), TransactionType.RECEIVE);
        if (totalGiven == null) totalGiven = BigDecimal.ZERO;
        if (totalReceived == null) totalReceived = BigDecimal.ZERO;

        BigDecimal currentBalance = totalGiven.subtract(totalReceived);
        BigDecimal creditLimit = customer.getCreditLimit() != null ? customer.getCreditLimit() : new BigDecimal("10000.00");

        List<String> factors = new ArrayList<>();
        int score = 85; // Default safe score out of 100

        if (creditLimit.compareTo(BigDecimal.ZERO) > 0) {
            double ratio = currentBalance.doubleValue() / creditLimit.doubleValue();
            if (ratio > 0.90) {
                score -= 40;
                factors.add("Current balance exceeds 90% of allocated credit limit.");
            } else if (ratio > 0.60) {
                score -= 20;
                factors.add("High credit utilization ratio (>60%).");
            } else {
                factors.add("Credit utilization is within safe thresholds.");
            }
        }

        if (totalReceived.compareTo(BigDecimal.ZERO) == 0 && totalGiven.compareTo(BigDecimal.ZERO) > 0) {
            score -= 25;
            factors.add("Zero payment repayment history recorded so far.");
        } else if (totalReceived.compareTo(totalGiven.multiply(new BigDecimal("0.7"))) >= 0) {
            score += 10;
            factors.add("Strong historical repayment track record (>70% cleared).");
        }

        score = Math.max(10, Math.min(100, score));

        String riskLevel = "LOW";
        String recommendation = "Safe to issue fresh credit. Maintain regular follow-ups.";
        if (score < 45) {
            riskLevel = "HIGH";
            recommendation = "CAUTION: Customer balance is dangerously close to limit. Hold fresh credit until partial settlement.";
        } else if (score < 70) {
            riskLevel = "MEDIUM";
            recommendation = "MODERATE RISK: Limit fresh credit to small amounts and request partial repayment.";
        }

        // Sync computed risk level back to Customer entity
        customer.setRiskLevel(riskLevel);
        customerRepository.save(customer);

        return RiskAnalysisResponse.builder()
                .customerId(customer.getId())
                .customerName(customer.getName())
                .riskLevel(riskLevel)
                .riskScore(score)
                .creditLimit(creditLimit)
                .currentBalance(currentBalance)
                .recommendation(recommendation)
                .riskFactors(factors)
                .build();
    }

    /**
     * AI Cashflow Insights
     */
    public CashflowInsightResponse getCashflowInsights(Long merchantId) {
        BigDecimal totalGiven = transactionRepository.sumAmountByMerchantIdAndType(merchantId, TransactionType.GIVE);
        BigDecimal totalReceived = transactionRepository.sumAmountByMerchantIdAndType(merchantId, TransactionType.RECEIVE);
        if (totalGiven == null) totalGiven = BigDecimal.ZERO;
        if (totalReceived == null) totalReceived = BigDecimal.ZERO;

        BigDecimal totalOutstanding = totalGiven.subtract(totalReceived);
        if (totalOutstanding.compareTo(BigDecimal.ZERO) < 0) totalOutstanding = BigDecimal.ZERO;

        List<Customer> customers = customerRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        int totalDebtors = (int) customers.stream().filter(c -> {
            BigDecimal g = transactionRepository.sumAmountByCustomerIdAndType(c.getId(), TransactionType.GIVE);
            BigDecimal r = transactionRepository.sumAmountByCustomerIdAndType(c.getId(), TransactionType.RECEIVE);
            if (g == null) g = BigDecimal.ZERO;
            if (r == null) r = BigDecimal.ZERO;
            return g.subtract(r).compareTo(BigDecimal.ZERO) > 0;
        }).count();

        String healthStatus = "HEALTHY";
        List<String> advice = new ArrayList<>();
        String summaryText;
        String predictedTimeframe = "7 to 14 days";

        if (totalOutstanding.compareTo(new BigDecimal("50000.00")) > 0) {
            healthStatus = "CRITICAL";
            summaryText = String.format("High credit exposure detected! You have ₹%.2f locked across %d active debtors.", totalOutstanding, totalDebtors);
            advice.add("Send Automated WhatsApp Reminders to High-Risk debtors immediately.");
            advice.add("Temporarily restrict fresh credit lines until at least 30% of outstanding balance is recovered.");
            advice.add("Offer small settlement incentives for early UPI clearance.");
            predictedTimeframe = "15 to 30 days with automated reminders";
        } else if (totalOutstanding.compareTo(new BigDecimal("15000.00")) > 0) {
            healthStatus = "MODERATE";
            summaryText = String.format("Moderate udhaar balance of ₹%.2f. Cashflow is steady but requires periodic collection.", totalOutstanding);
            advice.add("Schedule weekly polite reminder alerts.");
            advice.add("Review credit limits for customers with over 60% limit utilization.");
            predictedTimeframe = "7 to 10 days";
        } else {
            summaryText = String.format("Excellent cashflow management! Total credit extended is ₹%.2f across %d debtors.", totalOutstanding, totalDebtors);
            advice.add("Maintain current credit policy and prompt logging.");
            advice.add("Encourage regular digital UPI payments.");
            predictedTimeframe = "3 to 5 days";
        }

        return CashflowInsightResponse.builder()
                .totalOutstanding(totalOutstanding)
                .totalDebtors(totalDebtors)
                .healthStatus(healthStatus)
                .summaryText(summaryText)
                .actionableAdvice(advice)
                .predictedCollectionTimeframe(predictedTimeframe)
                .build();
    }
}
