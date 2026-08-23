package spring_swap.v2.dtos.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import spring_swap.v2.document.chat.MessageType;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String id;
    private String chatId;
    private String senderId;
    private MessageType type;
    private String content;
    private String mediaUrl;
    private String mediaFileName;
    private Long mediaSizeBytes;
    private boolean temporary;
    private Instant expiresAt;
    private Map<String, Instant> seenBy;
    private boolean edited;
    private Instant editedAt;
    private boolean deleted;
    private Instant deletedAt;
    private String replyToMessageId;
    private Map<String, String> reactions;
    private Instant createdAt;
}