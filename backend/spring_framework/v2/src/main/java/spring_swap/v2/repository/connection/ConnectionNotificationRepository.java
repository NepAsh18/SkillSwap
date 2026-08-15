package spring_swap.v2.repository.connection;

import org.springframework.data.mongodb.repository.MongoRepository;
import spring_swap.v2.document.connection.ConnectionNotificationDocument;

import java.util.List;

public interface ConnectionNotificationRepository extends MongoRepository<ConnectionNotificationDocument, String> {
    List<ConnectionNotificationDocument> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId);
    long countByRecipientUserIdAndReadFalse(String recipientUserId);
}