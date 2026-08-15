package spring_swap.v2.dtos.connection;

import lombok.Builder;
import lombok.Data;
import spring_swap.v2.document.connection.ConnectionStatus;

import java.time.Instant;

@Data
@Builder
public class ConnectionRequestResponse {
    private String id;
    private String senderId;
    private String receiverId;

    private String otherUserId;
    private String otherUserName;
    private String otherUserUsername;
    private String otherUserPicture;

    private ConnectionStatus status;
    private Instant createdAt;
    private Instant respondedAt;
}