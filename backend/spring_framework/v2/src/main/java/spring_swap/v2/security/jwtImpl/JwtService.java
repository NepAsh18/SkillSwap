package spring_swap.v2.security.jwtImpl;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import spring_swap.v2.exceptions.InvalidCredentialsException;
import spring_swap.v2.models.auth.Role;
import spring_swap.v2.models.auth.User;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTtlSeconds;
    @Getter
    private final long refreshTtlSeconds;
    private final String issuer;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.access-ttl-seconds:600}") long accessTtlSeconds,
            @Value("${security.jwt.refresh-ttl-seconds:86400}") long refreshTtlSeconds,
            @Value("${security.jwt.issuer:spring-swap-v2}") String issuer
    ) {
        if (secret == null || secret.length() < 64) {
            throw new IllegalStateException("JWT secret must be at least 64 characters. Provide via env configuration.");
        }

        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtlSeconds = accessTtlSeconds;
        this.refreshTtlSeconds = refreshTtlSeconds;
        this.issuer = issuer;
    }

    // ---------------- ACCESS TOKEN ----------------
    public String generateAccessToken(User user) {

        Instant now = Instant.now();

        List<String> roles = user.getRoles() == null
                ? List.of()
                : user.getRoles()
                .stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getId().toString())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTtlSeconds)))
                .claim("email", user.getEmail())
                .claim("roles", roles)
                .claim("typ", "access")
                .signWith(key)
                .compact();
    }

    // ---------------- REFRESH TOKEN ----------------
    // Generates the raw signed cryptographic JWT string
    public String generateRefreshToken(User user, String jti) {
        Instant now = Instant.now();

        return Jwts.builder()
                .id(jti)
                .subject(user.getId().toString())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(refreshTtlSeconds)))
                .claim("typ", "refresh")
                .signWith(key)
                .compact();
    }

    // Safely extracts the JTI claim from an incoming string
    public String extractJti(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getId();
        } catch (ExpiredJwtException e) {

            throw new InvalidCredentialsException("Refresh token has expired. Please log in again.");
        } catch (SignatureException e) {
            throw new InvalidCredentialsException("Invalid token signature.");
        } catch (Exception e) {
            throw new InvalidCredentialsException("Malformed session token.");
        }
    }

    // ---------------- PARSE TOKEN ----------------
    public Jws<Claims> parse(String token) {

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
    }

    // ---------------- CHECK TOKEN TYPE ----------------
    public boolean isAccessToken(String token) {

        Claims claims = parse(token).getPayload();
        return "access".equals(claims.get("typ"));
    }

    // ---------------- EXTRACT USER ID ----------------
    public UUID getUserId(String token) {

        Claims claims = parse(token).getPayload();
        return UUID.fromString(claims.getSubject());
    }
}