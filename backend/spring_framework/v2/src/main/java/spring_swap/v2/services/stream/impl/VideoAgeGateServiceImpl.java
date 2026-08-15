package spring_swap.v2.services.stream.impl;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import spring_swap.v2.dtos.stream.AgeVerificationRequestDTO;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.models.stream.UserAgeVerification;
import spring_swap.v2.models.stream.Video;
import spring_swap.v2.repo.auth.UserRepository;
import spring_swap.v2.repo.stream.UserAgeVerificationRepository;
import spring_swap.v2.repo.stream.VideoRepository;
import spring_swap.v2.services.stream.VideoAgeGateService;
import spring_swap.v2.helpers.AgeProofVerifier;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoAgeGateServiceImpl implements VideoAgeGateService {

    private final UserAgeVerificationRepository verificationRepository;
    private final UserRepository                userRepository;
    private final VideoRepository               videoRepository;
    private final AgeProofVerifier              ageProofVerifier;


    @Override
    @Transactional
    public void verifyAge(UUID userId, AgeVerificationRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        boolean valid =
                ageProofVerifier.verify(dto.zkProof());

        if (!valid) {
            throw new IllegalArgumentException(
                    "Invalid age proof");
        }

        String proofHash = sha256(dto.zkProof());

        // Upsert — a user can re-verify after revocation
        UserAgeVerification verification = verificationRepository
                .findByUserId(userId)
                .orElse(UserAgeVerification.builder().user(user).build());

        verification.setVerified(true);
        verification.setZkProofHash(proofHash);
        verification.setVerifiedAt(Instant.now());
        verification.setRevokedAt(null);

        verificationRepository.save(verification);
        log.info("Age verification granted [userId={}, proofHash={}]", userId, proofHash);
    }

    @Override
    public boolean isUserVerified(UUID userId) {
        return verificationRepository.existsByUserIdAndVerifiedTrue(userId);
    }

    /**
     * Guards every streaming endpoint.
     * Throws {@link AccessDeniedException} if:
     *   - the video is marked is18Plus=true AND
     *   - the requesting user has no active age verification.

     * No-op (passes silently) if the video is not 18+.
     */
    @Override
    public void assertAccess(UUID userId, UUID videoUuid) {
        Video video = videoRepository.findByVideoUuid(videoUuid)
                .orElseThrow(() -> new RuntimeException("Video not found: " + videoUuid));

        if (video.is18Plus() && !isUserVerified(userId)) {
            log.warn("Access denied: unverified user {} attempted 18+ video {}", userId, videoUuid);
            throw new AccessDeniedException(
                    "This content is age-restricted. Please complete age verification to continue.");
        }
    }


    @Override
    @Transactional
    public void revokeVerification(UUID userId) {
        verificationRepository.findByUserId(userId).ifPresentOrElse(v -> {
            v.setVerified(false);
            v.setRevokedAt(Instant.now());
            verificationRepository.save(v);
            log.warn("[ADMIN] Age verification revoked for userId={}", userId);
        }, () -> log.warn("[ADMIN] revokeVerification: no record found for userId={}", userId));
    }

    // ── Crypto helpers ────────────────────────────────────────────────────────

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 unavailable", e);
        }
    }
}