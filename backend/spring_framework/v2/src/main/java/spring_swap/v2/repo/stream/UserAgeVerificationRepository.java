package spring_swap.v2.repo.stream;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import spring_swap.v2.models.stream.UserAgeVerification;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAgeVerificationRepository extends JpaRepository<UserAgeVerification, Long> {

    Optional<UserAgeVerification> findByUserId(UUID userId);

    boolean existsByUserIdAndVerifiedTrue(UUID userId);
}