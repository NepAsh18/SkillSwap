package spring_swap.v2.controllers.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.dtos.auth.LoginRequest;
import spring_swap.v2.dtos.auth.RegisterRequest;
import spring_swap.v2.dtos.auth.AuthResponse;
import spring_swap.v2.dtos.auth.ProfileResponse;
import spring_swap.v2.services.auth.AuthService;
import spring_swap.v2.security.CookieService;
import spring_swap.v2.exceptions.InvalidCredentialsException;
import spring_swap.v2.security.jwtImpl.JwtService;

import java.util.Arrays;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieService cookieService;
    private final JwtService jwtService; // Needed to read TTL configuration safely

    @PostMapping("/register")
    public ResponseEntity<ProfileResponse> register(@Valid @RequestBody RegisterRequest request) {
        return new ResponseEntity<>(authService.register(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        // 1. Delegate core authentication and DB entity state management to AuthService
        AuthResponse authResponse = authService.login(request);

        // 2. Intercept the refresh token string out of the payload to attach via HttpOnly cookie
        cookieService.attachRefreshCookie(
                response,
                authResponse.getRefreshToken(),
                (int) jwtService.getRefreshTtlSeconds()
        );
        cookieService.addNoStoreHeaders(response);

        // 3. Return the payload safely back to client application memory
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {

        // 1. Extract the raw token safely from the incoming cookie state
        String rawRefreshToken = readRefreshTokenFromCookie(request)
                .orElseThrow(() -> new InvalidCredentialsException("Refresh token is missing from secure storage context."));

        // 2. Ask AuthService to validate, verify breach rotation, and produce the replacement nodes
        AuthResponse rotatedResponse = authService.refresh(rawRefreshToken);

        // 3. Bind the newly rotated refresh token back down to the user's browser cookie
        cookieService.attachRefreshCookie(
                response,
                rotatedResponse.getRefreshToken(),
                (int) jwtService.getRefreshTtlSeconds()
        );
        cookieService.addNoStoreHeaders(response);

        return ResponseEntity.ok(rotatedResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        // Optional: If you want to mark the token as revoked in the database during logout,
        // you can extract it and pass it to a service method like: authService.logout(token);

        cookieService.clearRefreshCookie(response);
        cookieService.addNoStoreHeaders(response);
        return ResponseEntity.noContent().build();
    }

    /**
     * Helper method isolated purely to controller layer to pluck tracking context.
     */
    private Optional<String> readRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookieService.getRefreshTokenCookieName().equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> !value.isBlank())
                .findFirst();
    }
}