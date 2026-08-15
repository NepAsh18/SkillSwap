package spring_swap.v2.services.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import spring_swap.v2.dtos.auth.LoginRequest;
import spring_swap.v2.dtos.auth.RegisterRequest;
import spring_swap.v2.dtos.auth.AuthResponse;
import spring_swap.v2.dtos.auth.ProfileResponse;
import spring_swap.v2.exceptions.DuplicateResourceException;
import spring_swap.v2.exceptions.InvalidCredentialsException;
import spring_swap.v2.exceptions.ResourceNotFoundException;
import spring_swap.v2.mapper.UserMapper;
import spring_swap.v2.models.auth.Role;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.models.auth.RefreshToken; // Added imports
import spring_swap.v2.repo.auth.RefreshTokenRepository;
import spring_swap.v2.repo.auth.RoleRepository;
import spring_swap.v2.repo.auth.UserRepository;
import spring_swap.v2.security.jwtImpl.JwtService;

import java.time.Instant; // Added imports
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j // Implements the 'log' variable automatically via Lombok
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserMapper userMapper;
    private final JwtService jwtService;

    @Transactional
    public ProfileResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new DuplicateResourceException("Email is already registered onto our systems.");
        }

        User user = userMapper.toEntity(request);
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Assigning standard secure user role
        Role defaultRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new ResourceNotFoundException("Role configuration 'USER' could not be resolved."));
        user.setRoles(Set.of(defaultRole));

        return userMapper.toProfileResponse(userRepository.save(user));
    }

    // Removed (readOnly = true) because we are persisting the new refresh token row
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Log the incoming attempt safely
        log.info("Authentication attempt initiated for identity: {}", request.getIdentity());

        // 2. Fetch the user
        User user = userRepository.findByEmailOrUsername(request.getIdentity(), request.getIdentity())
                .orElseThrow(() -> {
                    log.warn("Authentication failed: Identity '{}' not found.", request.getIdentity());
                    return new InvalidCredentialsException("Invalid login credentials provided.");
                });

        // 3. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Authentication failed: Incorrect password for identity '{}'.", request.getIdentity());
            throw new InvalidCredentialsException("Invalid login credentials provided.");
        }

        // 4. Generate stable tracking JTI
        log.info("User '{}' successfully authenticated. Generating security tokens.", request.getIdentity());
        String jti = UUID.randomUUID().toString();

        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenStr = jwtService.generateRefreshToken(user, jti); // Using our stable jti

        // 5. Persist the record of this refresh token inside database state
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

    /**
     * Handles Refresh Token Rotation flow when access token expires.
     */
    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        // 1. Unpack the JTI claim out of the incoming crypto string wrapper
        String incomingJti = jwtService.extractJti(rawRefreshToken);

        // 2. Match it to our system records
        RefreshToken storedToken = refreshTokenRepository.findByJti(incomingJti)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid session context."));

        // 3. BREACH ROTATION DETECTION
        // If an already 'revoked' token arrives back, someone cloned/stole it.
        if (storedToken.isRevoked()) {
            log.warn("CRITICAL: Revoked Refresh Token JTI: {} was reused! Revoking all sessions for safety.", incomingJti);

            // Immediate containment step: nuke everything active for this user ID
            refreshTokenRepository.revokeAllUserTokens(storedToken.getUser().getId());

            throw new InvalidCredentialsException("Session compromise detected. Forced re-authentication required.");
        }

        // 4. Expiration check against DB timestamp
        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            log.warn("Session JTI: {} failed temporal validity (Expired).", incomingJti);
            throw new InvalidCredentialsException("Session expired. Please log in again.");
        }

        User user = storedToken.getUser();
        log.info("Rotating tokens for user ID: {}. Invalidating old JTI: {}", user.getId(), incomingJti);

        // 5. Build properties for the next active rotation node
        String newJti = UUID.randomUUID().toString();
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshTokenStr = jwtService.generateRefreshToken(user, newJti);

        // 6. Chain old node state to the new tracking JTI and mark as inactive
        storedToken.setRevoked(true);
        storedToken.setReplacedByToken(newJti);
        refreshTokenRepository.save(storedToken);

        // 7. Save the new active session metadata
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