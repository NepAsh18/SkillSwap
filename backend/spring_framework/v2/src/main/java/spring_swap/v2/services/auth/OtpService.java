package spring_swap.v2.services.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import spring_swap.v2.exceptions.InvalidCredentialsException;
import spring_swap.v2.models.auth.OtpCode;
import spring_swap.v2.models.auth.OtpPurpose;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.repo.auth.OtpCodeRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpCodeRepository otpCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_ATTEMPTS = 5;

    @Value("${security.otp.ttl-seconds:300}")
    private long otpTtlSeconds;

    // Debounce: if an active code for this user+purpose was created within
    // this many seconds, skip regenerating it entirely. Protects against
    // accidental double form-submits invalidating a code already emailed.
    @Value("${security.otp.debounce-seconds:10}")
    private long debounceSeconds;

    // Test/demo accounts get a fixed known code instead of a random emailed
    // one. Comma-separated, case-insensitive. Empty by default (no exemptions).
    @Value("${security.otp.exempt-emails:}")
    private String exemptEmailsRaw;

    @Value("${security.otp.exempt-base-code:000000}")
    private String exemptBaseCode;

    private Set<String> exemptEmails;

    private Set<String> getExemptEmails() {
        if (exemptEmails == null) {
            exemptEmails = new HashSet<>();
            if (exemptEmailsRaw != null && !exemptEmailsRaw.isBlank()) {
                Arrays.stream(exemptEmailsRaw.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(String::toLowerCase)
                        .forEach(exemptEmails::add);
            }
        }
        return exemptEmails;
    }

    /**
     * Generates a fresh 6-digit OTP, invalidates any prior active codes for this
     * user+purpose, persists the hashed code, and emails it — unless the user's
     * email is exempt (fixed base code, no email sent) or a fresh active code
     * already exists within the debounce window (no-op in that case).
     *
     * REQUIRES_NEW: this MUST commit independently of the calling transaction.
     * AuthService.login() calls this then deliberately throws
     * OtpRequiredException to abort token issuance. With default REQUIRED
     * propagation, that unchecked exception would roll back this insert too.
     * REQUIRES_NEW opens a separate transaction that commits here regardless
     * of what the caller does afterward.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateAndSendOtp(User user, OtpPurpose purpose) {

        List<OtpCode> existingActive = otpCodeRepository
                .findByUserIdAndPurposeAndConsumedFalseOrderByCreatedAtDesc(user.getId(), purpose);

        if (!existingActive.isEmpty()) {
            OtpCode mostRecent = existingActive.get(0);
            boolean stillFresh = mostRecent.getCreatedAt()
                    .isAfter(Instant.now().minusSeconds(debounceSeconds));
            boolean stillValid = mostRecent.getExpiresAt().isAfter(Instant.now());

            if (stillFresh && stillValid) {
                log.info("Debounced duplicate OTP request for user ID: {} purpose: {} — no new code generated.",
                        user.getId(), purpose);
                return;
            }
        }

        otpCodeRepository.invalidateActiveCodes(user.getId(), purpose);

        boolean isExempt = user.getEmail() != null
                && getExemptEmails().contains(user.getEmail().toLowerCase());

        String rawCode = isExempt ? exemptBaseCode : generateSixDigitCode();
        Instant now = Instant.now();

        OtpCode otpCode = OtpCode.builder()
                .userId(user.getId())
                .codeHash(passwordEncoder.encode(rawCode))
                .purpose(purpose)
                .createdAt(now)
                .expiresAt(now.plusSeconds(otpTtlSeconds))
                .attempts(0)
                .consumed(false)
                .build();

        otpCodeRepository.save(otpCode);

        if (isExempt) {
            log.info("OTP exempt account — using base code for user ID: {} purpose: {} (no email sent)",
                    user.getId(), purpose);
        } else {
            emailService.sendOtpEmail(user.getEmail(), rawCode, purpose, otpTtlSeconds);
            log.info("OTP generated for user ID: {} purpose: {}", user.getId(), purpose);
        }
    }

    @Transactional
    public void verifyOtp(User user, OtpPurpose purpose, String submittedCode) {
        List<OtpCode> activeCodes = otpCodeRepository
                .findByUserIdAndPurposeAndConsumedFalseOrderByCreatedAtDesc(user.getId(), purpose);

        if (activeCodes.isEmpty()) {
            throw new InvalidCredentialsException("No active verification code found. Please request a new one.");
        }

        OtpCode latest = activeCodes.get(0);

        if (latest.isConsumed()) {
            throw new InvalidCredentialsException("This verification code has already been used.");
        }

        if (latest.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidCredentialsException("Verification code has expired. Please request a new one.");
        }

        if (latest.getAttempts() >= MAX_ATTEMPTS) {
            throw new InvalidCredentialsException("Too many incorrect attempts. Please request a new code.");
        }

        if (!passwordEncoder.matches(submittedCode, latest.getCodeHash())) {
            latest.setAttempts(latest.getAttempts() + 1);
            otpCodeRepository.save(latest);
            throw new InvalidCredentialsException("Invalid verification code.");
        }

        latest.setConsumed(true);
        otpCodeRepository.save(latest);

        log.info("OTP successfully verified for user ID: {} purpose: {}", user.getId(), purpose);
    }

    private String generateSixDigitCode() {
        int code = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(code);
    }
}