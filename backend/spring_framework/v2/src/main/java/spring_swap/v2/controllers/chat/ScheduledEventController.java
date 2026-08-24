package spring_swap.v2.controllers.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.dtos.chat.CreateScheduledEventDto;
import spring_swap.v2.dtos.chat.ScheduledEventResponse;
import spring_swap.v2.services.chat.ScheduledEventService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chats/{chatId}/events")
public class ScheduledEventController {

    private final ScheduledEventService scheduledEventService;

    @PostMapping
    public ScheduledEventResponse schedule(
            @PathVariable String chatId,
            @RequestBody CreateScheduledEventDto dto,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return scheduledEventService.scheduleEvent(chatId, currentUserId, dto);
    }

    @GetMapping
    public List<ScheduledEventResponse> list(
            @PathVariable String chatId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return scheduledEventService.getEventsForChat(chatId, currentUserId);
    }

    /** Returns the Jitsi room name — only succeeds once status == STARTED. */
    @PostMapping("/{eventId}/join")
    public ScheduledEventResponse join(
            @PathVariable String chatId,
            @PathVariable String eventId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        return scheduledEventService.joinEvent(eventId, currentUserId);
    }

    @PostMapping("/{eventId}/end")
    public Map<String, String> markEnded(
            @PathVariable String chatId,
            @PathVariable String eventId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        scheduledEventService.markEnded(eventId, currentUserId);
        return Map.of("status", "ended");
    }

    @DeleteMapping("/{eventId}")
    public Map<String, String> cancel(
            @PathVariable String chatId,
            @PathVariable String eventId,
            @AuthenticationPrincipal UUID currentUserId
    ) {
        scheduledEventService.cancelEvent(eventId, currentUserId);
        return Map.of("status", "canceled");
    }
}
