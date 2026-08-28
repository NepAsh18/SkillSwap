package spring_swap.v2.controllers.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.document.chat.ScheduledEventNotificationDocument;
import spring_swap.v2.services.chat.ScheduledEventInAppNotificationService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/events/notifications")
public class ScheduledEventNotificationController {

    private final ScheduledEventInAppNotificationService notificationService;

    @GetMapping
    public List<ScheduledEventNotificationDocument> getNotifications(@AuthenticationPrincipal UUID currentUserId) {
        return notificationService.getForUser(currentUserId.toString());
    }

    @GetMapping("/count")
    public Map<String, Long> getUnreadCount(@AuthenticationPrincipal UUID currentUserId) {
        return Map.of("unread", notificationService.getUnreadCount(currentUserId.toString()));
    }

    @PutMapping("/{id}/read")
    public void markRead(@PathVariable String id) {
        notificationService.markAsRead(id);
    }

    @PutMapping("/read-all")
    public void markAllRead(@AuthenticationPrincipal UUID currentUserId) {
        notificationService.markAllAsRead(currentUserId.toString());
    }
}
