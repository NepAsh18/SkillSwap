package spring_swap.v2.controllers.connection;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.document.connection.ConnectionNotificationDocument;
import spring_swap.v2.dtos.connection.ConnectionRequestResponse;
import spring_swap.v2.dtos.connection.CreateConnectionRequestDto;
import spring_swap.v2.services.auth.ProfileService;
import spring_swap.v2.services.connection.ConnectionInAppNotificationService;
import spring_swap.v2.services.connection.ConnectionService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/connections")
public class ConnectionController {

    private final ConnectionService connectionService;
    private final ConnectionInAppNotificationService notificationService;
    private final ProfileService profileService;



    @PostMapping("/request")
    public ConnectionRequestResponse sendRequest(
            @AuthenticationPrincipal UUID currentUserId,
            @RequestBody CreateConnectionRequestDto dto
    ) {
        var me = profileService.getProfile(currentUserId);
        // NOTE: adjust getUsername()/getPicture() to whatever your profile
        // object actually exposes — matching MatchmakingService's usage of
        // seeker.getSkillsProficient() etc. on this same object.
        return connectionService.sendRequest(
                currentUserId, me.getName(), me.getUsername(), me.getPicture(), dto);
    }

    @PostMapping("/{requestId}/accept")
    public ConnectionRequestResponse accept(
            @PathVariable String requestId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return connectionService.accept(requestId, currentUserId);
    }

    @PostMapping("/{requestId}/decline")
    public ConnectionRequestResponse decline(
            @PathVariable String requestId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return connectionService.decline(requestId, currentUserId);
    }

    @PostMapping("/{requestId}/cancel")
    public ConnectionRequestResponse cancel(
            @PathVariable String requestId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return connectionService.cancel(requestId, currentUserId);
    }

    /** Accepted connections — feeds the connections list page. */
    @GetMapping
    public List<ConnectionRequestResponse> getMyConnections(@AuthenticationPrincipal UUID currentUserId) {
        return connectionService.getMyConnections(currentUserId);
    }

    /** Requests I've sent that are still pending — feeds the `sentRequests` map in ConnectionsContext. */
    @GetMapping("/sent")
    public List<ConnectionRequestResponse> getSentPending(@AuthenticationPrincipal UUID currentUserId) {
        return connectionService.getMySentPending(currentUserId);
    }

    /** Requests I've received that are still pending. */
    @GetMapping("/incoming")
    public List<ConnectionRequestResponse> getIncomingPending(@AuthenticationPrincipal UUID currentUserId) {
        return connectionService.getMyIncomingPending(currentUserId);
    }

    @GetMapping("/notifications")
    public List<ConnectionNotificationDocument> getNotifications(@AuthenticationPrincipal UUID currentUserId) {
        return notificationService.getForUser(currentUserId.toString());
    }

    @GetMapping("/notifications/count")
    public Map<String, Long> getNotificationCount(@AuthenticationPrincipal UUID currentUserId) {
        return Map.of("unread", notificationService.getUnreadCount(currentUserId.toString()));
    }

    @PutMapping("/notifications/{id}/read")
    public void markNotificationRead(@PathVariable String id) {
        notificationService.markAsRead(id);
    }

    @PutMapping("/notifications/read-all")
    public void markAllNotificationsRead(@AuthenticationPrincipal UUID currentUserId) {
        notificationService.markAllAsRead(currentUserId.toString());
    }
}