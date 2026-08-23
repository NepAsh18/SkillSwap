package spring_swap.v2.controllers.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.document.chat.MessageType;
import spring_swap.v2.dtos.chat.MessageResponse;
import spring_swap.v2.dtos.chat.ReactionEventDto;
import spring_swap.v2.dtos.chat.SendMessageDto;
import spring_swap.v2.dtos.chat.UpdateChatSettingsDto;
import spring_swap.v2.services.chat.MessageService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chats/{chatId}/messages")
public class MessageController {

    private final MessageService messageService;

    /**
     * REST send endpoint — kept for reliability/fallback (e.g. retry after a
     * dropped socket). The primary send path in production is the WebSocket
     * STOMP endpoint, which also broadcasts in real time; this one does not.
     */
    @PostMapping
    public MessageResponse sendText(
            @PathVariable String chatId,
            @RequestBody SendMessageDto dto,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return messageService.sendText(chatId, currentUserId, dto);
    }

    @GetMapping
    public List<MessageResponse> getMessages(
            @PathVariable String chatId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Integer size,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return messageService.getMessages(chatId, currentUserId, page, size);
    }

    /**
     * REST fallback for deleting a message — primary delete path is the
     * WebSocket STOMP endpoint, which also broadcasts live; this one does not.
     */
    @DeleteMapping("/{messageId}")
    public MessageResponse deleteMessage(
            @PathVariable String chatId,
            @PathVariable String messageId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return messageService.deleteMessage(chatId, messageId, currentUserId);
    }

    /**
     * REST fallback for toggling a reaction — primary path is the WebSocket
     * STOMP endpoint, which also broadcasts live; this one does not.
     */
    @PutMapping("/{messageId}/react")
    public MessageResponse react(
            @PathVariable String chatId,
            @PathVariable String messageId,
            @RequestBody ReactionEventDto dto,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return messageService.toggleReaction(chatId, messageId, currentUserId, dto.getEmoji());
    }

    @PutMapping("/read")
    public Map<String, String> markAsRead(
            @PathVariable String chatId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        messageService.markAsRead(chatId, currentUserId);
        return Map.of("status", "read");
    }

    /**
     * Backs the "Files" page: GET .../messages/media?type=IMAGE&q=vacation
     * Returns media messages of one type in this chat, newest first, optionally
     * filtered by filename substring.
     */
    @GetMapping("/media")
    public List<MessageResponse> getMediaMessages(
            @PathVariable String chatId,
            @RequestParam MessageType type,
            @RequestParam(required = false) String q,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return messageService.getMediaMessages(chatId, currentUserId, type, q);
    }

    @PutMapping("/settings")
    public Map<String, String> updateSettings(
            @PathVariable String chatId,
            @RequestBody UpdateChatSettingsDto dto,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        messageService.updateSettings(chatId, currentUserId, dto.getTemporaryDefault(), dto.getTemporaryDurationMinutes());
        return Map.of("status", "updated");
    }
}