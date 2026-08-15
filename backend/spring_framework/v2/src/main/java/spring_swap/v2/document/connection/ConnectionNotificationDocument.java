package spring_swap.v2.document.connection;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "connections_notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionNotificationDocument {
    @Id
    private String id;
    private String recipientUserId;
    private ConnectionNotificationType type;

    private String title;
    private String body;
    private String actorUserId;
    private String actorName;
    private String actorUsername;
    private String actorPicture;

    private String connectionRequestId;

    private boolean read;
    private Instant createdAt;



}
