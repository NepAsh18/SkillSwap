package spring_swap.v2.document.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "scheduled_event_notifications")
public class ScheduledEventNotificationDocument {

    @Id
    private String id;

    @Indexed
    private String recipientUserId;

    private ScheduledEventNotificationType type;
    private String title;
    private String body;

    // Who triggered it (the scheduler), so the UI can show an avatar if desired.
    private String actorUserId;
    private String actorName;
    private String actorPicture;

    private String scheduledEventId;
    private String chatId;

    private boolean read;
    private Instant createdAt;
}
