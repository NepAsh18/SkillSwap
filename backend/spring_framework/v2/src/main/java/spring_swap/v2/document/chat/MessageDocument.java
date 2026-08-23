package spring_swap.v2.document.chat;

import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
@CompoundIndexes({
        @CompoundIndex(name = "chat_time_idx", def = "{'chatId': 1, 'createdAt': -1}")
})
public class MessageDocument {

    @Id
    private String id;

    @Indexed
    private String chatId;

    private String senderId;

    private MessageType type; // TEXT, IMAGE, VIDEO, DOC

    @Lob
    private String content; // text body, or caption for media

    // Only set when type != TEXT
    private String mediaUrl;
    private String mediaFileName;
    private Long mediaSizeBytes;

    private boolean temporary;

    @Indexed(name = "message_ttl_idx", expireAfter = "0s")
    private Instant expiresAt;

    @Builder.Default
    private Map<String, Instant> seenBy = new java.util.HashMap<>();

    private Instant createdAt;

    @Field("edited")
    private boolean edited;
    private Instant editedAt;

    // Soft-delete: content/media are cleared once deleted=true, but the row
    // stays so ordering, timestamps, and seenBy history survive.
    @Field("deleted")
    private boolean deleted;
    private Instant deletedAt;

    // Set when this message is a reply to another. Null for normal messages.
    // We store the id only (not a denormalized snippet) — the frontend
    // resolves the preview text from its own already-loaded message list,
    // falling back to a fetch only if the replied-to message isn't in view.
    private String replyToMessageId;

    // userId -> emoji. One reaction per user per message (re-reacting with a
    // different emoji replaces their previous one; reacting with the same
    // emoji again removes it — toggle behavior lives in MessageService).
    @Builder.Default
    private Map<String, String> reactions = new java.util.HashMap<>();
}