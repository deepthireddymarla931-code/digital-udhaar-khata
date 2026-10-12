package com.digitaludhaar.repository;

import com.digitaludhaar.model.Transaction;
import com.digitaludhaar.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByCustomerIdOrderByTransactionDateDesc(Long customerId);
    List<Transaction> findByMerchantIdOrderByTransactionDateDesc(Long merchantId);
    List<Transaction> findTop10ByMerchantIdOrderByTransactionDateDesc(Long merchantId);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.customer.id = :customerId AND t.type = :type")
    BigDecimal sumAmountByCustomerIdAndType(@Param("customerId") Long customerId, @Param("type") TransactionType type);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.merchant.id = :merchantId AND t.type = :type")
    BigDecimal sumAmountByMerchantIdAndType(@Param("merchantId") Long merchantId, @Param("type") TransactionType type);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.merchant.id = :merchantId AND t.type = :type " +
           "AND t.transactionDate >= :startDate AND t.transactionDate <= :endDate")
    BigDecimal sumAmountByMerchantIdAndTypeAndDateRange(
            @Param("merchantId") Long merchantId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
