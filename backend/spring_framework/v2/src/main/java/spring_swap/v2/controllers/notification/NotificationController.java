package spring_swap.v2.controllers.notification;


import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.document.notification.NotificationDocument;
import spring_swap.v2.dtos.notificaton.NotificationCountResponse;
import spring_swap.v2.dtos.notificaton.NotificationResponse;
import spring_swap.v2.services.notification.NotificationService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;


    @GetMapping
    @PreAuthorize("hasRole('COMMITTEE')")
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        String userId = extractUserId(userDetails);
        List<NotificationDocument> docs =
                notificationService.getNotificationsForUser(userId);

        List<NotificationResponse> response = docs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }


    @GetMapping("/count")
    @PreAuthorize("hasRole('COMMITTEE')")
    public ResponseEntity<NotificationCountResponse> getCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        String userId = extractUserId(userDetails);
        return ResponseEntity.ok(NotificationCountResponse.builder()
                .unread(notificationService.getUnreadCount(userId))
                .total(notificationService.getNotificationsForUser(userId).size())
                .build());
    }


    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('COMMITTEE')")
    public ResponseEntity<Void> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {

        notificationService.markAsRead(id, extractUserId(userDetails));
        return ResponseEntity.noContent().build();
    }

    // PUT — mark all notifications as read
    @PutMapping("/read-all")
    @PreAuthorize("hasRole('COMMITTEE')")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {

        notificationService.markAllAsRead(extractUserId(userDetails));
        return ResponseEntity.noContent().build();
    }

    private NotificationResponse mapToResponse(NotificationDocument doc) {
        return NotificationResponse.builder()
                .id(doc.getId())
                .type(doc.getType())
                .title(doc.getTitle())
                .body(doc.getBody())
                .subjectUserName(doc.getSubjectUserName())
                .skill(doc.getSkill())
                .newTier(doc.getNewTier())
                .read(doc.isRead())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    private String extractUserId(UserDetails userDetails) {
        return userDetails.getUsername();
    }
}
