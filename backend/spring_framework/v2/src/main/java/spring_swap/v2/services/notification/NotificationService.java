package spring_swap.v2.services.notification;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.notification.NotificationDocument;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.repo.auth.UserRepository;
import spring_swap.v2.repository.notification.NotificationRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;   // your existing Postgres user repo


    public void notifyCommitteeOfTierAdvancement(
            UUID subjectUserId,
            String skill,
            String newTier,
            String sessionId) {

        // Fetch subject user's name for the notification body
        User subjectUser = userRepo.findById((subjectUserId))
                .orElse(null);
        String userName = subjectUser != null ? subjectUser.getName() : "A user";

        // Fetch all committee members from Postgres
        List<User> committeeMembers = userRepo.findAllCommitteeMembers();

        if (committeeMembers.isEmpty()) {
            log.warn("No ROLE_COMMITTEE members found — notification skipped");
            return;
        }

        String title = buildTitle(newTier, userName, skill);
        String body  = buildBody(newTier, userName, skill, sessionId);

        // Create one notification per committee member
        List<NotificationDocument> notifications = committeeMembers.stream()
                .map(member -> NotificationDocument.builder()
                        .recipientUserId(member.getId().toString())
                        .type("BADGE_TIER_ADVANCED")
                        .title(title)
                        .body(body)
                        .subjectUserId(subjectUserId)
                        .subjectUserName(userName)
                        .skill(skill)
                        .newTier(newTier)
                        .sessionId(sessionId)
                        .read(false)
                        .createdAt(Instant.now())
                        .build())
                .collect(Collectors.toList());

        notificationRepo.saveAll(notifications);

        log.info("Notified {} committee members: user={} skill={} tier={}",
                notifications.size(), subjectUserId, skill, newTier);
    }

    // Committee member marks a notification as read
    public void markAsRead(String notificationId, String requestingUserId) {
        NotificationDocument doc = notificationRepo.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));

        // Security check — only the recipient can mark it read
        if (!doc.getRecipientUserId().equals(requestingUserId)) {
            throw new SecurityException("Not authorised to read this notification");
        }

        doc.setRead(true);
        notificationRepo.save(doc);
    }

    // Mark all as read for a user
    public void markAllAsRead(String userId) {
        List<NotificationDocument> unread =
                notificationRepo.findByRecipientUserIdAndRead(userId, false);
        unread.forEach(n -> n.setRead(true));
        notificationRepo.saveAll(unread);
    }

    public List<NotificationDocument> getNotificationsForUser(String userId) {
        return notificationRepo.findByRecipientUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepo.countByRecipientUserIdAndRead(userId, false);
    }

    private String buildTitle(String tier, String userName, String skill) {
        return switch (tier) {
            case "EXPERT" -> userName + " reached Expert in " + skill;
            case "MASTER" -> userName + " reached Master in " + skill + " — review required";
            default       -> userName + " advanced to " + tier + " in " + skill;
        };
    }

    private String buildBody(String tier, String userName, String skill, String sessionId) {

        String body = switch (tier) {
            case "EXPERT" -> String.format(
                    "%s has reached Expert level in %s through consistent performance. "
                            + "Please review their profile for potential committee consideration.",
                    userName, skill
            );
            case "MASTER" -> String.format(
                    "%s has achieved Master tier in %s. "
                            + "This is the highest tier — your review and approval is requested.",
                    userName, skill
            );
            default -> String.format(
                    "%s advanced to %s in %s.",
                    userName, tier, skill
            );
        };

        if (sessionId != null) {
            body += " Session ID: " + sessionId;
        }

        return body;
    }
}
