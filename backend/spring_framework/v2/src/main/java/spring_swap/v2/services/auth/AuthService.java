package spring_swap.v2.services.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import spring_swap.v2.dtos.auth.LoginRequest;
import spring_swap.v2.dtos.auth.RegisterRequest;
import spring_swap.v2.dtos.auth.AuthResponse;
import spring_swap.v2.exceptions.DuplicateResourceException;
import spring_swap.v2.exceptions.InvalidCredentialsException;
import spring_swap.v2.exceptions.OtpRequiredException;
import spring_swap.v2.exceptions.ResourceNotFoundException;
import spring_swap.v2.mapper.UserMapper;
import spring_swap.v2.models.auth.OtpPurpose;
import spring_swap.v2.models.auth.Role;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.models.auth.RefreshToken;
import spring_swap.v2.repo.auth.RefreshTokenRepository;
import spring_swap.v2.repo.auth.RoleRepository;
import spring_swap.v2.repo.auth.UserRepository;
import spring_swap.v2.security.jwtImpl.JwtService;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserMapper userMapper;
    private final JwtService jwtService;
    private final OtpService otpService;

    private static final long TRUST_WINDOW_SECONDS = 36_000L; // 10 hours

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new DuplicateResourceException("Email is already registered onto our systems.");
        }

        User user = userMapper.toEntity(request);
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Role defaultRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new ResourceNotFoundException("Role configuration 'USER' could not be resolved."));
        user.setRoles(Set.of(defaultRole));

        User savedUser = userRepository.save(user);

        otpService.generateAndSendOtp(savedUser, OtpPurpose.REGISTER);

        return savedUser;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Authentication attempt initiated for identity: {}", request.getIdentity());

        User user = userRepository.findByEmailOrUsername(request.getIdentity(), request.getIdentity())
                .orElseThrow(() -> {
                    log.warn("Authentication failed: Identity '{}' not found.", request.getIdentity());
                    return new InvalidCredentialsException("Invalid login credentials provided.");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Authentication failed: Incorrect password for identity '{}'.", request.getIdentity());
            throw new InvalidCredentialsException("Invalid login credentials provided.");
        }

        Instant trustWindowCutoff = Instant.now().minusSeconds(TRUST_WINDOW_SECONDS);
        boolean withinTrustWindow = user.getLastOtpVerifiedAt() != null
                && user.getLastOtpVerifiedAt().isAfter(trustWindowCutoff);

        if (!withinTrustWindow) {
            log.info("OTP trust window expired or absent for user ID: {}. Sending OTP for login.", user.getId());
            otpService.generateAndSendOtp(user, OtpPurpose.LOGIN);

            String preAuthToken = jwtService.generatePreAuthToken(user, "LOGIN");
            throw new OtpRequiredException(preAuthToken, jwtService.getPreAuthTtlSeconds());
        }

        log.info("User '{}' successfully authenticated. Generating security tokens.", request.getIdentity());
        String jti = UUID.randomUUID().toString();

        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenStr = jwtService.generateRefreshToken(user, jti);

        Instant now = Instant.now();
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .jti(jti)
                .user(user)
                .createdAt(now)
                .expiresAt(now.plusSeconds(jwtService.getRefreshTtlSeconds()))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        log.debug("Tokens successfully generated and tracked for user ID: {}", user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .user(userMapper.toProfileResponse(user))
                .build();
    }

    @Transactional
    public AuthResponse verifyOtpAndIssueTokens(String preAuthToken, String code) {
        if (!jwtService.isPreAuthToken(preAuthToken)) {
            throw new InvalidCredentialsException("Invalid or expired verification session.");
        }

        UUID userId = jwtService.getUserId(preAuthToken);
        String purposeStr = jwtService.extractPreAuthPurpose(preAuthToken);
        OtpPurpose purpose = OtpPurpose.valueOf(purposeStr);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("User not found."));

        otpService.verifyOtp(user, purpose, code);

        user.setLastOtpVerifiedAt(Instant.now());
        userRepository.save(user);

        String jti = UUID.randomUUID().toString();
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenStr = jwtService.generateRefreshToken(user, jti);

        Instant now = Instant.now();
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .jti(jti)
                .user(user)
                .createdAt(now)
                .expiresAt(now.plusSeconds(jwtService.getRefreshTtlSeconds()))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        log.info("2FA verified and tokens issued for user ID: {}", user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .user(userMapper.toProfileResponse(user))
                .build();
    }

    @Transactional
    public PreAuthBundle resendOtp(String preAuthToken) {
        if (!jwtService.isPreAuthToken(preAuthToken)) {
            throw new InvalidCredentialsException("Invalid or expired verification session.");
        }

        UUID userId = jwtService.getUserId(preAuthToken);
        String purposeStr = jwtService.extractPreAuthPurpose(preAuthToken);
        OtpPurpose purpose = OtpPurpose.valueOf(purposeStr);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("User not found."));

        otpService.generateAndSendOtp(user, purpose);

        String newPreAuthToken = jwtService.generatePreAuthToken(user, purposeStr);

        log.info("OTP resent for user ID: {} purpose: {}", user.getId(), purpose);

        return new PreAuthBundle(newPreAuthToken, jwtService.getPreAuthTtlSeconds());
    }

    public record PreAuthBundle(String preAuthToken, long expiresInSeconds) {}

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String incomingJti = jwtService.extractJti(rawRefreshToken);

        RefreshToken storedToken = refreshTokenRepository.findByJti(incomingJti)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid session context."));

        if (storedToken.isRevoked()) {
            log.warn("CRITICAL: Revoked Refresh Token JTI: {} was reused! Revoking all sessions for safety.", incomingJti);
            refreshTokenRepository.revokeAllUserTokens(storedToken.getUser().getId());
            throw new InvalidCredentialsException("Session compromise detected. Forced re-authentication required.");
        }

        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            log.warn("Session JTI: {} failed temporal validity (Expired).", incomingJti);
            throw new InvalidCredentialsException("Session expired. Please log in again.");
        }

        User user = storedToken.getUser();
        log.info("Rotating tokens for user ID: {}. Invalidating old JTI: {}", user.getId(), incomingJti);

        String newJti = UUID.randomUUID().toString();
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshTokenStr = jwtService.generateRefreshToken(user, newJti);

        storedToken.setRevoked(true);
        storedToken.setReplacedByToken(newJti);
        refreshTokenRepository.save(storedToken);

        Instant now = Instant.now();
        RefreshToken newRefreshTokenEntity = RefreshToken.builder()
                .jti(newJti)
                .user(user)
                .createdAt(now)
                .expiresAt(now.plusSeconds(jwtService.getRefreshTtlSeconds()))
                .revoked(false)
                .build();

        refreshTokenRepository.save(newRefreshTokenEntity);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenStr)
                .user(userMapper.toProfileResponse(user))
                .build();
    }
}