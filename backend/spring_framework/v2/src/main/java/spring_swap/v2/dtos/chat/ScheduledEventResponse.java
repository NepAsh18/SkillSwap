package spring_swap.v2.dtos.chat;

import lombok.Builder;
import lombok.Data;
import spring_swap.v2.document.chat.EventStatus;

import java.time.Instant;

@Data
@Builder
public class ScheduledEventResponse {
    private String id;
    private String chatId;
    private String title;
    private String createdBy;
    private Instant scheduledAt;
    private EventStatus status;
    private Instant startedAt;
    private Instant endedAt;
    private Instant createdAt;

    // Only populated once status == STARTED — the frontend uses this as the
    // Jitsi roomName. Withheld before start so no one can "peek" a room name
    // and join early outside the app's own join-gating.
    private String jitsiRoomName;
}
