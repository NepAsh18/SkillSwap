package spring_swap.v2.services.chat;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.chat.ChatDocument;
import spring_swap.v2.document.chat.ScheduledEventDocument;
import spring_swap.v2.document.chat.ScheduledEventNotificationDocument;
import spring_swap.v2.document.chat.ScheduledEventNotificationType;
import spring_swap.v2.repository.chat.ScheduledEventNotificationRepository;
import spring_swap.v2.services.auth.ProfileService;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ScheduledEventInAppNotificationService {

    private final ScheduledEventNotificationRepository repository;
    private final ProfileService profileService;

    public void notifyScheduled(ScheduledEventDocument event, ChatDocument chat) {
        var actor = profileService.getProfile(UUID.fromString(event.getCreatedBy()));
        for (String participantId : chat.getParticipantIds()) {
            if (participantId.equals(event.getCreatedBy())) continue; // don't notify the scheduler about their own action
            save(participantId, ScheduledEventNotificationType.EVENT_SCHEDULED,
                    "Call scheduled",
                    actor.getName() + " scheduled \"" + event.getTitle() + "\" in " + chatLabel(chat),
                    event, chat, actor.getName(), actor.getPicture());
        }
    }

    public void notifyStarting(ScheduledEventDocument event, ChatDocument chat) {
        for (String participantId : chat.getParticipantIds()) {
            save(participantId, ScheduledEventNotificationType.EVENT_STARTING,
                    "Call starting now",
                    "\"" + event.getTitle() + "\" is starting now in " + chatLabel(chat),
                    event, chat, null, null);
        }
    }

    public void notifyCanceled(ScheduledEventDocument event, ChatDocument chat) {
        for (String participantId : chat.getParticipantIds()) {
            if (participantId.equals(event.getCreatedBy())) continue;
            save(participantId, ScheduledEventNotificationType.EVENT_CANCELED,
                    "Call canceled",
                    "\"" + event.getTitle() + "\" in " + chatLabel(chat) + " was canceled",
                    event, chat, null, null);
        }
    }

    private String chatLabel(ChatDocument chat) {
        return chat.getName() != null ? chat.getName() : "your chat";
    }

    private void save(String recipientId, ScheduledEventNotificationType type, String title, String body,
                       ScheduledEventDocument event, ChatDocument chat, String actorName, String actorPicture) {
        ScheduledEventNotificationDocument doc = ScheduledEventNotificationDocument.builder()
                .recipientUserId(recipientId)
                .type(type)
                .title(title)
                .body(body)
                .actorUserId(event.getCreatedBy())
                .actorName(actorName)
                .actorPicture(actorPicture)
                .scheduledEventId(event.getId())
                .chatId(chat.getId())
                .read(false)
                .createdAt(Instant.now())
                .build();
        repository.save(doc);
    }

    public List<ScheduledEventNotificationDocument> getForUser(String userId) {
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
        List<ScheduledEventNotificationDocument> unread = repository.findByRecipientUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(n -> n.setRead(true));
        repository.saveAll(unread);
    }
}
