package spring_swap.v2.document.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chats")
public class ChatDocument {

    @Id
    private String id;

    private ChatType type; // DIRECT or GROUP

    @Indexed
    private List<String> participantIds; // includes leader for GROUP

    // GROUP only — null for DIRECT
    private String leaderId;
    private String name;
    private String avatarUrl;

    // Max 5 total participants for GROUP, enforced at service layer.
    private static final int MAX_GROUP_SIZE = 5;

    private Instant createdAt;
    private Instant lastMessageAt; // for sorting chat list, updated on each send
    private String lastMessagePreview; // short snippet for chat list UI
}
