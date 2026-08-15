package spring_swap.v2.services.connection;


import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.connection.ConnectionNotificationDocument;
import spring_swap.v2.document.connection.ConnectionNotificationType;
import spring_swap.v2.document.connection.ConnectionRequestDocument;
import spring_swap.v2.repository.connection.ConnectionNotificationRepository;

import java.time.Instant;
import java.util.List;

@Service
@AllArgsConstructor
public class ConnectionInAppNotificationService {

    private final ConnectionNotificationRepository repository;

    public void notifyRequestReceived(ConnectionRequestDocument req) {
        save(req.getReceiverId(), ConnectionNotificationType.CONNECTION_REQUEST_RECEIVED,
                "New connection request",
                req.getSenderName() + " wants to connect with you.",
                req);
    }

    public void notifyRequestAccepted(ConnectionRequestDocument req) {
        // Goes to the original sender — they're the one who'll be glad to hear it.
        save(req.getSenderId(), ConnectionNotificationType.CONNECTION_REQUEST_ACCEPTED,
                "Connection accepted",
                req.getReceiverName() + " accepted your connection request.",
                req);
    }

    public void notifyRequestDeclined(ConnectionRequestDocument req) {
        save(req.getSenderId(), ConnectionNotificationType.CONNECTION_REQUEST_DECLINED,
                "Connection declined",
                req.getReceiverName() + " declined your connection request.",
                req);
    }

    public void notifyRequestCanceled(ConnectionRequestDocument req) {
        save(req.getReceiverId(), ConnectionNotificationType.CONNECTION_REQUEST_CANCELED,
                "Connection request withdrawn",
                req.getSenderName() + " withdrew their connection request.",
                req);
    }
    private void save(String recipientId, ConnectionNotificationType type, String title, String body,
                      ConnectionRequestDocument req) {
        boolean recipientIsSender = recipientId.equals(req.getSenderId());
        ConnectionNotificationDocument doc = ConnectionNotificationDocument.builder()
                .recipientUserId(recipientId)
                .type(type)
                .title(title)
                .body(body)
                .actorUserId(recipientIsSender ? req.getReceiverId() : req.getSenderId())
                .actorName(recipientIsSender ? req.getReceiverName() : req.getSenderName())
                .actorUsername(recipientIsSender ? req.getReceiverUsername() : req.getSenderUserName())
                .actorPicture(recipientIsSender ? req.getReceiverPicture() : req.getSenderPicture())
                .connectionRequestId(req.getId())
                .read(false)
                .createdAt(Instant.now())
                .build();
        repository.save(doc);
    }

    public List<ConnectionNotificationDocument> getForUser(String userId) {
        return repository.findByRecipientUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return repository.countByRecipientUserIdAndReadFalse(userId);
    }

    public void markAsRead(String notificationId) {
        repository.findById(notificationId).ifPresent(doc -> {
            doc.setRead(true);
            repository.save(doc);
        });
    }

    public void markAllAsRead(String userId) {
        List<ConnectionNotificationDocument> unread = repository.findByRecipientUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(n -> n.setRead(true));
        repository.saveAll(unread);
    }



}
