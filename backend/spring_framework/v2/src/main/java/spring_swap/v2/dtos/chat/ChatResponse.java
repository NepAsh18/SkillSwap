package spring_swap.v2.dtos.chat;

import lombok.Builder;
import lombok.Data;
import spring_swap.v2.document.chat.ChatType;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ChatResponse {
    private String id;
    private ChatType type;
    private List<String> participantIds;
    private String leaderId;
    private String name;
    private String avatarUrl;
    private Instant lastMessageAt;
    private String lastMessagePreview;
    private Map<String, ParticipantSummary> participants;

    // Denormalized for DIRECT chats — the "other" user, resolved by the service
    // from ProfileService so the frontend doesn't need a second lookup.
    private String otherUserId;
    private String otherUserName;
    private String otherUserUsername;
    private String otherUserPicture;

    private long unreadCount;
}
