package spring_swap.v2.security;


import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import spring_swap.v2.exceptions.InvalidCredentialsException;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.repo.auth.UserRepository;

import java.util.UUID;


@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;


    public UUID getCurrentUserId() {
        Authentication auth = getAuthentication();

        if (auth.getPrincipal() instanceof UUID id) {
            return id;
        }

        if (auth.getPrincipal() instanceof User user) {
            return user.getId();
        }

        if (auth.getPrincipal() instanceof UserDetails details) {
            return parseUuidOrLookup(details.getUsername());
        }

        if (auth.getPrincipal() instanceof String subject) {
            return parseUuidOrLookup(subject);
        }

        throw new InvalidCredentialsException("Cannot resolve user identity from security context.");
    }


    public User getCurrentUser() {
        UUID userId = getCurrentUserId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Authenticated user no longer exists in the system."));
    }


    public boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated()
                && !(auth.getPrincipal() instanceof String s && s.equals("anonymousUser"));
    }

    // ── Private ────────────────────────────────────────────────────────────────

    private Authentication getAuthentication() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new InvalidCredentialsException("No authenticated session found.");
        }
        return auth;
    }

    private UUID parseUuidOrLookup(String subject) {
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException ignored) {
            // subject is email or username — resolve to UUID via DB
            return userRepository.findByEmailOrUsername(subject, subject)
                    .map(User::getId)
                    .orElseThrow(() -> new InvalidCredentialsException(
                            "Cannot resolve identity '" + subject + "' to a registered user."));
        }
    }
}
