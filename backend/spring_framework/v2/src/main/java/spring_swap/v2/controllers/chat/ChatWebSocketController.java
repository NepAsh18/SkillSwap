package spring_swap.v2.controllers.chat;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import spring_swap.v2.dtos.chat.*;
import spring_swap.v2.services.chat.MessageService;

import java.security.Principal;
import java.util.UUID;

/**
 * LIVE side of chat. Compare to MessageController (plain REST):
 * - REST  = "save this message" (client polls / refreshes to see new ones)
 * - STOMP = "save this message AND instantly push it to everyone in the chat"
 *
 * Frontend usage (conceptually, with a STOMP client like @stomp/stompjs):
 *   stompClient.subscribe(`/topic/chat/${chatId}`, msg => { ... new message / delete / reaction update arrived ... })
 *   stompClient.subscribe(`/topic/chat/${chatId}/typing`, msg => { ... show "X is typing" ... })
 *   stompClient.publish({ destination: `/app/chat/${chatId}/send`, body: JSON.stringify(dto) })
 *   stompClient.publish({ destination: `/app/chat/${chatId}/messages/${messageId}/delete`, body: "{}" })
 *   stompClient.publish({ destination: `/app/chat/${chatId}/messages/${messageId}/react`, body: JSON.stringify({ emoji: "❤️" }) })
 *
 * "Principal principal" is populated by ChatChannelInterceptor from the JWT.
 */
@Controller
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(MessageService messageService,
                                   SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    /** Client sends here to publish a text message. dto.replyToMessageId is optional. */
    @MessageMapping("/chat/{chatId}/send")
    public void sendMessage(
            @DestinationVariable String chatId,
            @Payload SendMessageDto dto,
            Principal principal
    ) {
        UUID senderId = UUID.fromString(principal.getName());

        MessageResponse saved = messageService.sendText(chatId, senderId, dto);

        messagingTemplate.convertAndSend("/topic/chat/" + chatId, saved);
    }

    /** Client sends here whenever the user starts/stops typing. Not persisted — purely live. */
    @MessageMapping("/chat/{chatId}/typing")
    public void typing(
            @DestinationVariable String chatId,
            @Payload TypingEventDto dto,
            Principal principal
    ) {
        TypingBroadcast broadcast = TypingBroadcast.builder()
                .chatId(chatId)
                .userId(principal.getName())
                .typing(dto.isTyping())
                .build();

        messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", broadcast);
    }

    /** Client sends here when a message becomes visible on screen (read receipt / blue-tick). */
    @MessageMapping("/chat/{chatId}/seen")
    public void seen(
            @DestinationVariable String chatId,
            @Payload SeenEventDto dto,
            Principal principal
    ) {
        UUID userId = UUID.fromString(principal.getName());
        MessageResponse updated = messageService.markMessageSeen(dto.getMessageId(), userId);

        messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/seen", updated);
    }

    /**
     * Client sends here to delete one of their own messages. Reuses the same
     * /topic/chat/{chatId} channel new sends broadcast on — the frontend's
     * existing onMessage handler patches the message in place by id when
     * deleted=true instead of appending.
     */
    @MessageMapping("/chat/{chatId}/messages/{messageId}/delete")
    public void deleteMessage(
            @DestinationVariable String chatId,
            @DestinationVariable String messageId,
            Principal principal
    ) {
        UUID userId = UUID.fromString(principal.getName());
        MessageResponse updated = messageService.deleteMessage(chatId, messageId, userId);

        messagingTemplate.convertAndSend("/topic/chat/" + chatId, updated);
    }

    /**
     * Client sends here to add/remove/change their reaction on a message.
     * Broadcast on the same /topic/chat/{chatId} channel — the frontend
     * upserts by message id, so a reaction update just patches the existing
     * bubble's reactions map in place, same mechanism as delete.
     */
    @MessageMapping("/chat/{chatId}/messages/{messageId}/react")
    public void react(
            @DestinationVariable String chatId,
            @DestinationVariable String messageId,
            @Payload ReactionEventDto dto,
            Principal principal
    ) {
        UUID userId = UUID.fromString(principal.getName());
        MessageResponse updated = messageService.toggleReaction(chatId, messageId, userId, dto.getEmoji());

        messagingTemplate.convertAndSend("/topic/chat/" + chatId, updated);
    }
}