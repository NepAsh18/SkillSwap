package spring_swap.v2.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import spring_swap.v2.dtos.auth.ApiError;
import spring_swap.v2.security.jwtImpl.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor // Automatically creates the constructor for your final dependencies
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Disable CSRF safely for stateless REST APIs using JWTs
                .csrf(AbstractHttpConfigurer::disable)


                .cors(cors -> cors.configurationSource(corsConfigurationSource("http://localhost:5173")))

                // 3. Keep sessions strictly stateless (No cookie tracking)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. Request Authorization Gateway Rules
                .authorizeHttpRequests(auth -> auth
                        // Allow the entire public authentication cluster free passage
                        .requestMatchers("/uploads/profile-pictures/**").permitAll()
                        .requestMatchers("/api/v1/auth/**", "/error").permitAll()
                        .requestMatchers("/api/v1/home/public/**").permitAll()
                        .requestMatchers("/api/v1/home/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/committee/**").hasRole("COMMITTEE_MEMBER")
                        .requestMatchers("/ws-chat/**").permitAll()


                        // Block everything else behind verification locks
                        .anyRequest().authenticated()
                )

                // 5. Intercept Filter Errors cleanly into JSON structures
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(this::handleUnauthorized)
                        .accessDeniedHandler(this::handleForbidden)
                )

                // 6. Plug in your JWT filter right ahead of the base authentication worker
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Handles 401 Unauthorized exceptions (e.g. Broken/Missing Tokens)
    private void handleUnauthorized(HttpServletRequest request, HttpServletResponse response,
                                    org.springframework.security.core.AuthenticationException authException) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");

        String exceptionDetail = request.getAttribute("error") != null ? (String) request.getAttribute("error") : authException.getMessage();
        var apiError = ApiError.of(HttpStatus.UNAUTHORIZED.value(), "Unauthorized Access Attempt", exceptionDetail, request.getRequestURI(), true);

        response.getWriter().write(new ObjectMapper().writeValueAsString(apiError));
    }

    // Handles 403 Forbidden exceptions (e.g. Authenticated, but lacks role clearance)
    private void handleForbidden(HttpServletRequest request, HttpServletResponse response,
                                 org.springframework.security.access.AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json");

        String exceptionDetail = request.getAttribute("error") != null ? (String) request.getAttribute("error") : accessDeniedException.getMessage();
        var apiError = ApiError.of(HttpStatus.FORBIDDEN.value(), "Forbidden Resource Access", exceptionDetail, request.getRequestURI(), true);

        response.getWriter().write(new ObjectMapper().writeValueAsString(apiError));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Matches your AuthService injection cleanly
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.front-end-url:*}") String corsUrls) {
        String[] urls = corsUrls.trim().split(",");
        var config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(urls));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        var source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }




}