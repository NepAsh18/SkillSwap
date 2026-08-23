package spring_swap.v2.document.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_participant_settings")
@CompoundIndexes({
        @CompoundIndex(name = "chat_user_unique_idx", def = "{'chatId': 1, 'userId': 1}", unique = true)
})
public class ChatParticipantSettingsDocument {

    @Id
    private String id;

    private String chatId;
    private String userId;

    // This user's own default for messages THEY send in this chat.
    @Builder.Default
    private boolean temporaryDefault = false;

    // If temporaryDefault = true, how long until expiry (minutes).
    // Kept simple; UI can offer preset options (1h, 1d, 7d, etc).
    private Long temporaryDurationMinutes;

    // For unread counts / read receipts.
    private String lastReadMessageId;
    private Instant lastReadAt;

    // Soft "leave" — user left a GROUP chat but doc retained for history/audit.
    @Builder.Default
    private boolean left = false;
    private Instant leftAt;

    private Instant createdAt;
    private Instant updatedAt;
}
