package spring_swap.v2.repository.notification;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import spring_swap.v2.document.notification.NotificationDocument;

import java.util.List;


// repository/NotificationRepository.java
@Repository
public interface NotificationRepository
        extends MongoRepository<NotificationDocument, String> {

    List<NotificationDocument> findByRecipientUserIdOrderByCreatedAtDesc(
            String recipientUserId
    );

    List<NotificationDocument> findByRecipientUserIdAndRead(
            String recipientUserId, boolean read
    );

    long countByRecipientUserIdAndRead(String recipientUserId, boolean read);
}