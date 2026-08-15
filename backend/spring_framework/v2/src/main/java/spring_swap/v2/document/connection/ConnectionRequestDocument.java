package spring_swap.v2.document.connection;


import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "connection_requests")
@CompoundIndexes({
        @CompoundIndex(name = "sender_receiver_idx", def = "{'senderId': 1, 'receiverId': 1}"),
        @CompoundIndex(name = "receiver_status_idx", def = "{'receiverId': 1, 'status': 1}"),
        @CompoundIndex(name = "sender_status_idx", def = "{'senderId': 1, 'status': 1}")

})


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionRequestDocument {

    @Id
    private String id;
    private String senderId;
    private String receiverId;
    private String senderName;
    private String senderUserName;
    private String senderPicture;
    private String receiverName;
    private String receiverUsername;
    private String receiverPicture;

    private ConnectionStatus status;

    private Instant createdAt;
    private Instant respondedAt;

}
