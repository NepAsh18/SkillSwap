package spring_swap.v2.document.notification;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;


@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDocument {

    @Id
    private String id;

    private String recipientUserId;
    private String type;
    private String title;
    private String body;

    // Context payload
    private UUID subjectUserId;       // the user who earned the tier
    private String subjectUserName;
    private String skill;
    private String newTier;             // EXPERT or MASTER
    private String sessionId;           // optional — which session triggered it

    private boolean read;
    private Instant createdAt;
}