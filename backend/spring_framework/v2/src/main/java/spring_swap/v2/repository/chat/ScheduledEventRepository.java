package spring_swap.v2.repository.chat;

import org.springframework.data.mongodb.repository.MongoRepository;
import spring_swap.v2.document.chat.EventStatus;
import spring_swap.v2.document.chat.ScheduledEventDocument;

import java.time.Instant;
import java.util.List;

public interface ScheduledEventRepository extends MongoRepository<ScheduledEventDocument, String> {

    List<ScheduledEventDocument> findByChatId(String chatId);

    // Poller: events that should start now but haven't been notified yet.
    List<ScheduledEventDocument> findByStatusAndScheduledAtLessThanEqualAndStartNotificationSentFalse(
            EventStatus status, Instant now);

    void deleteByChatId(String chatId); // cascade on chat/group deletion
}
