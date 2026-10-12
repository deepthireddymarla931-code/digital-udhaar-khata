package com.digitaludhaar.repository;

import com.digitaludhaar.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop20ByMerchantIdOrderByTimestampDesc(Long merchantId);
}
