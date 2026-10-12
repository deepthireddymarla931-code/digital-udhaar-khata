package com.digitaludhaar.repository;

import com.digitaludhaar.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByMerchantIdOrderByCreatedAtDesc(Long merchantId);
    Optional<Customer> findByIdAndMerchantId(Long id, Long merchantId);
    Optional<Customer> findByMerchantIdAndPhone(Long merchantId, String phone);

    @Query("SELECT c FROM Customer c WHERE c.merchant.id = :merchantId AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR c.phone LIKE CONCAT('%', :query, '%'))")
    List<Customer> searchByNameOrPhone(@Param("merchantId") Long merchantId, @Param("query") String query);

    long countByMerchantId(Long merchantId);
}
