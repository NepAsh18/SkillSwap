package spring_swap.v2.repo.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import spring_swap.v2.models.auth.OtpCode;
import spring_swap.v2.models.auth.OtpPurpose;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface OtpCodeRepository extends JpaRepository<OtpCode, UUID> {

    List<OtpCode> findByUserIdAndPurposeAndConsumedFalseOrderByCreatedAtDesc(UUID userId, OtpPurpose purpose);

    @Modifying
    @Query("UPDATE OtpCode o SET o.consumed = true WHERE o.userId = :userId AND o.purpose = :purpose AND o.consumed = false")
    void invalidateActiveCodes(@Param("userId") UUID userId, @Param("purpose") OtpPurpose purpose);

    @Modifying
    @Query("DELETE FROM OtpCode o WHERE o.expiresAt < :cutoff")
    void deleteExpiredBefore(@Param("cutoff") Instant cutoff);
}