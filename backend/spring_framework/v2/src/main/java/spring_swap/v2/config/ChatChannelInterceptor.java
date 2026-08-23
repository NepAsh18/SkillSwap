package spring_swap.v2.config;

import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import spring_swap.v2.security.jwtImpl.JwtService;

import java.security.Principal;
import java.util.UUID;

/**
 * ⚠️ ACTION NEEDED: this class calls a placeholder `jwtService.validateAndGetUserId(token)`.
 * Swap that one line for however your REST layer currently validates JWTs
 * (whatever class checks the "Authorization: Bearer ..." header for your
 * @RestController endpoints — same logic, just called manually here since
 * WebSocket handshakes don't go through the normal Spring Security filter chain).
 *
 * How it works:
 * 1. Frontend connects and sends the STOMP CONNECT frame with header:
 *    Authorization: Bearer <jwt>
 * 2. This interceptor reads that header, validates the token, and extracts the userId.
 * 3. It wraps that userId in a Principal and attaches it to the STOMP session.
 * 4. From then on, every message on this socket connection carries that identity,
 *    so @MessageMapping methods can trust "who sent this" without re-checking.
 */
@Component
public class ChatChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public ChatChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing or malformed Authorization header on WebSocket CONNECT");
            }

            String token = authHeader.substring("Bearer ".length());
            if (!jwtService.isAccessToken(token)) {
                throw new IllegalArgumentException("WebSocket requires an access token");
            }

            UUID userId = jwtService.getUserId(token);

            // This Principal.getName() becomes accessible in controllers as
            // the "Principal principal" parameter, and drives /user/** routing.
            Principal principal = () -> userId.toString();
            accessor.setUser(principal);
        }

        return message;
    }
}