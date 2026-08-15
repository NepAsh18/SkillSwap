package spring_swap.v2.security.jwtImpl;



import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import spring_swap.v2.repo.auth.UserRepository;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
@Slf4j
@NullMarked
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                if (jwtService.isAccessToken(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
                    Jws<Claims> jws = jwtService.parse(token);
                    Claims claims = jws.getBody();
                    UUID userId = UUID.fromString(claims.getSubject());

                    userRepository.findById(userId).ifPresent(user -> {
                        List<GrantedAuthority> authorities = user.getRoles() == null ? List.of()
                                : user.getRoles().stream()
                                .map(r -> {
                                    String roleName = r.getName().toUpperCase();
                                    // Prevents accidentally creating ROLE_ROLE_ADMIN
                                    String finalRole = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
                                    return new SimpleGrantedAuthority(finalRole);
                                })
                                .collect(Collectors.toList());
                        // Using user.getId() as the core principal so it is instantly retrievable across execution layers
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                user.getId(), null, authorities
                        );
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
                }
            } catch (Exception e) {
                log.warn("JWT auth failed: {}", e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }



    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        // Skip JWT checking for login/auth endpoints AND the internal error path
        return path.startsWith("/api/v1/auth/") || path.equals("/error");
    }
}