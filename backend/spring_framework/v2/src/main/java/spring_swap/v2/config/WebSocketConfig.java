package spring_swap.v2.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

/**
 * Turns on STOMP-over-WebSocket support.
 *
 * How the pieces fit together:
 * - Frontend connects to  ws://.../ws-chat  (or wss:// in prod)
 * - Frontend SUBSCRIBES to topics like  /topic/chat/{chatId}  to receive messages
 * - Frontend SENDS to app destinations like  /app/chat/{chatId}/send  to send a message
 * - "/user" prefix is for messages aimed at ONE specific person (e.g. a private
 *   "you were added to a group" push) rather than a whole chat room.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final ChatChannelInterceptor chatChannelInterceptor;

    public WebSocketConfig(ChatChannelInterceptor chatChannelInterceptor) {
        this.chatChannelInterceptor = chatChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // withSockJS() gives a fallback for browsers/networks that block raw WebSocket.
        // If your frontend connects with a raw WebSocket client (not SockJS), you can
        // drop .withSockJS() — but keep it unless you know you don't need the fallback.
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*") // tighten to your real frontend origin(s) in prod
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Messages the SERVER pushes out live under these prefixes.
        registry.enableSimpleBroker("/topic", "/queue");
        // Messages the CLIENT sends to the server are routed to @MessageMapping methods
        // under this prefix (e.g. client sends to "/app/chat/{chatId}/send").
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix for user-specific (private) destinations, e.g. /user/queue/notifications.
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // This is what actually checks the JWT on every incoming STOMP frame.
        registration.interceptors(chatChannelInterceptor);
    }
}