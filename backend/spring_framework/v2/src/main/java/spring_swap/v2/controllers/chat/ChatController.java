package spring_swap.v2.controllers.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.document.chat.ChatDocument;
import spring_swap.v2.dtos.chat.ChatResponse;
import spring_swap.v2.dtos.chat.CreateGroupDto;
import spring_swap.v2.services.chat.ChatService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chats")
public class ChatController {

    private final ChatService chatService;

    /** Chat list for the sidebar — both DIRECT and GROUP, sorted by recent activity. */
    @GetMapping
    public List<ChatResponse> getMyChats(@AuthenticationPrincipal UUID currentUserId) {
        return chatService.getMyChats(currentUserId);
    }

    /** Lazy-create/fetch a DIRECT chat with another user (called right before sending first message). */
    @PostMapping("/direct/{otherUserId}")
    public ChatDocument getOrCreateDirectChat(
            @PathVariable String otherUserId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return chatService.getOrCreateDirectChat(currentUserId.toString(), otherUserId);
    }

    @PostMapping("/group")
    public ChatDocument createGroup(
            @RequestBody CreateGroupDto dto,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return chatService.createGroup(currentUserId, dto);
    }

    @GetMapping("/{chatId}")
    public ChatDocument getChat(
            @PathVariable String chatId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return chatService.getChatForParticipant(chatId, currentUserId);
    }

    @PostMapping("/{chatId}/members/{memberId}")
    public ChatDocument addMember(
            @PathVariable String chatId,
            @PathVariable String memberId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return chatService.addMember(chatId, currentUserId, memberId);
    }

    @DeleteMapping("/{chatId}/members/{memberId}")
    public ChatDocument removeMember(
            @PathVariable String chatId,
            @PathVariable String memberId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return chatService.removeMember(chatId, currentUserId, memberId);
    }

    @PostMapping("/{chatId}/leave")
    public Map<String, String> leaveGroup(
            @PathVariable String chatId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        chatService.leaveGroup(chatId, currentUserId);
        return Map.of("status", "left");
    }

    @DeleteMapping("/{chatId}")
    public Map<String, String> deleteChat(
            @PathVariable String chatId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        chatService.deleteChat(chatId, currentUserId);
        return Map.of("status", "deleted");
    }
}
