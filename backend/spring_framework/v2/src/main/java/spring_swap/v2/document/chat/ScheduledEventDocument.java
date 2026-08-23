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
@Document(collection = "scheduled_events")
public class ScheduledEventDocument {

    @Id
    private String id;

    @Indexed
    private String chatId;

    private String title;

    // Creator must be the leader for GROUP chats; either participant for DIRECT.
    private String createdBy;

    // Constraints enforced at service layer:
    // - must be in the future (no previous time)
    // - must be <= 3 months from creation
    // - hour/minute granularity
    @Indexed
    private Instant scheduledAt;

    @Builder.Default
    private EventStatus status = EventStatus.SCHEDULED;

    // Guards against the @Scheduled poller double-firing the "starting" notification.
    private boolean startNotificationSent;

    private Instant startedAt;
    private Instant endedAt;

    private Instant createdAt;
}
