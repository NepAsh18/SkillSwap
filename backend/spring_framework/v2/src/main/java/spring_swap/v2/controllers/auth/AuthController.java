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
import spring_swap.v2.dtos.auth.PreAuthResponse;
import spring_swap.v2.dtos.auth.VerifyOtpRequest;
import spring_swap.v2.dtos.auth.ResendOtpRequest;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.services.auth.AuthService;
import spring_swap.v2.security.CookieService;
import spring_swap.v2.exceptions.InvalidCredentialsException;
import spring_swap.v2.exceptions.OtpRequiredException;
import spring_swap.v2.security.jwtImpl.JwtService;

import java.util.Arrays;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieService cookieService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<PreAuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User savedUser = authService.register(request);
        String preAuthToken = jwtService.generatePreAuthToken(savedUser, "REGISTER");

        PreAuthResponse response = PreAuthResponse.builder()
                .preAuthToken(preAuthToken)
                .message("Verification code sent to your email.")
                .expiresInSeconds(jwtService.getPreAuthTtlSeconds())
                .build();

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        try {
            AuthResponse authResponse = authService.login(request);

            cookieService.attachRefreshCookie(
                    response,
                    authResponse.getRefreshToken(),
                    (int) jwtService.getRefreshTtlSeconds()
            );
            cookieService.addNoStoreHeaders(response);

            return ResponseEntity.ok(authResponse);

        } catch (OtpRequiredException otpRequired) {
            PreAuthResponse preAuthResponse = PreAuthResponse.builder()
                    .preAuthToken(otpRequired.getPreAuthToken())
                    .message("Verification code sent to your email.")
                    .expiresInSeconds(otpRequired.getExpiresInSeconds())
                    .build();
            return ResponseEntity.ok(preAuthResponse);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.verifyOtpAndIssueTokens(
                request.getPreAuthToken(),
                request.getCode()
        );

        cookieService.attachRefreshCookie(
                response,
                authResponse.getRefreshToken(),
                (int) jwtService.getRefreshTtlSeconds()
        );
        cookieService.addNoStoreHeaders(response);

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<PreAuthResponse> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        AuthService.PreAuthBundle bundle = authService.resendOtp(request.getPreAuthToken());

        PreAuthResponse response = PreAuthResponse.builder()
                .preAuthToken(bundle.preAuthToken())
                .message("A new verification code has been sent to your email.")
                .expiresInSeconds(bundle.expiresInSeconds())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {

        String rawRefreshToken = readRefreshTokenFromCookie(request)
                .orElseThrow(() -> new InvalidCredentialsException("Refresh token is missing from secure storage context."));

        AuthResponse rotatedResponse = authService.refresh(rawRefreshToken);

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
        cookieService.clearRefreshCookie(response);
        cookieService.addNoStoreHeaders(response);
        return ResponseEntity.noContent().build();
    }

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