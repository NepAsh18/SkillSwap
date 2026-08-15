package spring_swap.v2.services.stream;

import spring_swap.v2.dtos.stream.AgeVerificationRequestDTO;
import java.util.UUID;

public interface VideoAgeGateService {
    void verifyAge(UUID userId, AgeVerificationRequestDTO dto);
    boolean isUserVerified(UUID userId);
    void assertAccess(UUID userId, UUID videoUuid);
    void revokeVerification(UUID userId);
}