package spring_swap.v2.services.connection;

import org.springframework.stereotype.Service;
import spring_swap.v2.document.connection.ConnectionRequestDocument;
import spring_swap.v2.document.connection.ConnectionStatus;
import spring_swap.v2.dtos.connection.ConnectionRequestResponse;
import spring_swap.v2.dtos.connection.CreateConnectionRequestDto;
import spring_swap.v2.repository.connection.ConnectionRequestRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ConnectionService {

    private final ConnectionRequestRepository repository;
    private final ConnectionNotifier notifier;

    // Statuses that block sending a new request in either direction.
    private static final List<ConnectionStatus> BLOCKING_STATUSES =
            List.of(ConnectionStatus.PENDING, ConnectionStatus.ACCEPTED);

    public ConnectionService(ConnectionRequestRepository repository, ConnectionNotifier notifier) {
        this.repository = repository;
        this.notifier = notifier;
    }

    public ConnectionRequestResponse sendRequest(UUID senderId, String senderName, String senderUsername,
                                                 String senderPicture, CreateConnectionRequestDto dto) {
        String senderIdStr = senderId.toString();

        if (senderIdStr.equals(dto.getReceiverId())) {
            throw new IllegalArgumentException("Cannot send a connection request to yourself");
        }

        // Check both directions — if B already requested A, or they're already
        // connected, don't allow a duplicate/parallel request.
        boolean alreadyExists =
                repository.findBySenderIdAndReceiverIdAndStatusIn(senderIdStr, dto.getReceiverId(), BLOCKING_STATUSES).isPresent()
                        || repository.findBySenderIdAndReceiverIdAndStatusIn(dto.getReceiverId(), senderIdStr, BLOCKING_STATUSES).isPresent();

        if (alreadyExists) {
            throw new IllegalStateException("A connection request already exists between these users");
        }

        ConnectionRequestDocument req = ConnectionRequestDocument.builder()
                .senderId(senderIdStr)
                .receiverId(dto.getReceiverId())
                .senderName(senderName)
                .senderUserName(senderUsername)
                .senderPicture(senderPicture)
                .receiverName(dto.getReceiverName())
                .receiverUsername(dto.getReceiverUsername())
                .receiverPicture(dto.getReceiverPicture())
                .status(ConnectionStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        req = repository.save(req);
        notifier.notifyRequestCreated(req);

        return toResponse(req, senderIdStr);
    }

    public ConnectionRequestResponse accept(String requestId, UUID currentUserId) {
        ConnectionRequestDocument req = getOwnedByReceiver(requestId, currentUserId);
        assertPending(req);

        req.setStatus(ConnectionStatus.ACCEPTED);
        req.setRespondedAt(Instant.now());
        req = repository.save(req);

        notifier.notifyRequestAccepted(req);
        return toResponse(req, currentUserId.toString());
    }

    public ConnectionRequestResponse decline(String requestId, UUID currentUserId) {
        ConnectionRequestDocument req = getOwnedByReceiver(requestId, currentUserId);
        assertPending(req);

        req.setStatus(ConnectionStatus.DECLINED);
        req.setRespondedAt(Instant.now());
        req = repository.save(req);

        notifier.notifyRequestDeclined(req);
        return toResponse(req, currentUserId.toString());
    }

    public ConnectionRequestResponse cancel(String requestId, UUID currentUserId) {
        ConnectionRequestDocument req = getOwnedBySender(requestId, currentUserId);
        assertPending(req);

        req.setStatus(ConnectionStatus.CANCELED);
        req.setRespondedAt(Instant.now());
        req = repository.save(req);

        notifier.notifyRequestCanceled(req);
        return toResponse(req, currentUserId.toString());
    }

    public List<ConnectionRequestResponse> getMyConnections(UUID currentUserId) {
        String id = currentUserId.toString();
        return repository.findBySenderIdAndStatusOrReceiverIdAndStatus(
                        id, ConnectionStatus.ACCEPTED, id, ConnectionStatus.ACCEPTED)
                .stream()
                .map(req -> toResponse(req, id))
                .toList();
    }

    public List<ConnectionRequestResponse> getMySentPending(UUID currentUserId) {
        String id = currentUserId.toString();
        return repository.findBySenderIdAndStatus(id, ConnectionStatus.PENDING)
                .stream()
                .map(req -> toResponse(req, id))
                .toList();
    }

    public List<ConnectionRequestResponse> getMyIncomingPending(UUID currentUserId) {
        String id = currentUserId.toString();
        return repository.findByReceiverIdAndStatus(id, ConnectionStatus.PENDING)
                .stream()
                .map(req -> toResponse(req, id))
                .toList();
    }

    private ConnectionRequestDocument getOwnedByReceiver(String requestId, UUID currentUserId) {
        ConnectionRequestDocument req = repository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Connection request not found"));
        if (!req.getReceiverId().equals(currentUserId.toString())) {
            throw new IllegalStateException("Only the receiver can perform this action");
        }
        return req;
    }

    private ConnectionRequestDocument getOwnedBySender(String requestId, UUID currentUserId) {
        ConnectionRequestDocument req = repository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Connection request not found"));
        if (!req.getSenderId().equals(currentUserId.toString())) {
            throw new IllegalStateException("Only the sender can perform this action");
        }
        return req;
    }

    private void assertPending(ConnectionRequestDocument req) {
        if (req.getStatus() != ConnectionStatus.PENDING) {
            throw new IllegalStateException("Connection request is no longer pending");
        }
    }

    private ConnectionRequestResponse toResponse(ConnectionRequestDocument req, String currentUserId) {
        boolean isSender = req.getSenderId().equals(currentUserId);
        return ConnectionRequestResponse.builder()
                .id(req.getId())
                .senderId(req.getSenderId())
                .receiverId(req.getReceiverId())
                .otherUserId(isSender ? req.getReceiverId() : req.getSenderId())
                .otherUserName(isSender ? req.getReceiverName() : req.getSenderName())
                .otherUserUsername(isSender ? req.getReceiverUsername() : req.getSenderUserName())
                .otherUserPicture(isSender ? req.getReceiverPicture() : req.getSenderPicture())
                .status(req.getStatus())
                .createdAt(req.getCreatedAt())
                .respondedAt(req.getRespondedAt())
                .build();
    }
}