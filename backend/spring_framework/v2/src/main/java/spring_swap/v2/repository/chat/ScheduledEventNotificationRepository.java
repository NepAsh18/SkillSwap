package spring_swap.v2.repository.chat;

import org.springframework.data.mongodb.repository.MongoRepository;
import spring_swap.v2.document.chat.ScheduledEventNotificationDocument;

import java.util.List;

public interface ScheduledEventNotificationRepository extends MongoRepository<ScheduledEventNotificationDocument, String> {

    List<ScheduledEventNotificationDocument> findByRecipientUserIdOrderByCreatedAtDesc(String userId);

    long countByRecipientUserIdAndReadFalse(String userId);
}
