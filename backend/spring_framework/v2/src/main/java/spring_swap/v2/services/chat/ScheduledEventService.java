package spring_swap.v2.services.chat;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.chat.ChatDocument;
import spring_swap.v2.document.chat.ChatType;
import spring_swap.v2.document.chat.EventStatus;
import spring_swap.v2.document.chat.ScheduledEventDocument;
import spring_swap.v2.dtos.chat.CreateScheduledEventDto;
import spring_swap.v2.dtos.chat.ScheduledEventResponse;
import spring_swap.v2.exceptions.ChatDomainException;
import spring_swap.v2.repository.chat.ChatRepository;
import spring_swap.v2.repository.chat.ScheduledEventRepository;
import spring_swap.v2.services.auth.ProfileService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class ScheduledEventService {

    private static final int MAX_MONTHS_AHEAD = 3;

    private final ScheduledEventRepository eventRepository;
    private final ChatRepository chatRepository;
    private final ScheduledEventInAppNotificationService inAppNotificationService;
    private final ScheduledEventEmailService emailService;
    private final ProfileService profileService;

    public ScheduledEventService(ScheduledEventRepository eventRepository,
                                  ChatRepository chatRepository,
                                  ScheduledEventInAppNotificationService inAppNotificationService,
                                  ScheduledEventEmailService emailService,
                                  ProfileService profileService) {
        this.eventRepository = eventRepository;
        this.chatRepository = chatRepository;
        this.inAppNotificationService = inAppNotificationService;
        this.emailService = emailService;
        this.profileService = profileService;
    }

    /**
     * Schedules a call. Permission rule: GROUP chats — leader only. DIRECT
     * chats — either participant. This is the exact rule from the original
     * spec ("only leader can schedule the timing" for groups; unrestricted
     * for direct messages).
     */
    public ScheduledEventResponse scheduleEvent(String chatId, UUID currentUserId, CreateScheduledEventDto dto) {
        String userIdStr = currentUserId.toString();
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatDomainException("Chat not found"));

        if (!chat.getParticipantIds().contains(userIdStr)) {
            throw new ChatDomainException("You are not a participant in this chat");
        }
        if (chat.getType() == ChatType.GROUP && !userIdStr.equals(chat.getLeaderId())) {
            throw new ChatDomainException("Only the group leader can schedule a call");
        }

        validateSchedule(dto);

        ScheduledEventDocument event = ScheduledEventDocument.builder()
                .chatId(chatId)
                .title(dto.getTitle())
                .createdBy(userIdStr)
                .scheduledAt(dto.getScheduledAt())
                .status(EventStatus.SCHEDULED)
                .startNotificationSent(false)
                .createdAt(Instant.now())
                .build();

        event = eventRepository.save(event);

        try {
            inAppNotificationService.notifyScheduled(event, chat);
        } catch (Exception e) {
            log.error("Failed to create in-app notification for scheduled event", e);
        }
        try {
            for (String participantId : chat.getParticipantIds()) {
                if (participantId.equals(userIdStr)) continue;
                String email = resolveEmail(participantId);
                var scheduler = profileService.getProfile(currentUserId);
                emailService.sendEventScheduledEmail(email, scheduler.getName(), event.getTitle(), event.getScheduledAt());
            }
        } catch (Exception e) {
            log.error("Failed to send scheduled-event emails", e);
        }

        return toResponse(event, false);
    }

    public List<ScheduledEventResponse> getEventsForChat(String chatId, UUID currentUserId) {
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatDomainException("Chat not found"));
        if (!chat.getParticipantIds().contains(currentUserId.toString())) {
            throw new ChatDomainException("You are not a participant in this chat");
        }
        return eventRepository.findByChatId(chatId).stream()
                .map(e -> toResponse(e, e.getStatus() == EventStatus.STARTED))
                .toList();
    }

    /**
     * Returns the Jitsi room name ONLY if the event has actually started —
     * enforces "only after schedule start there should be option to join".
     */
    public ScheduledEventResponse joinEvent(String eventId, UUID currentUserId) {
        ScheduledEventDocument event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ChatDomainException("Event not found"));
        ChatDocument chat = chatRepository.findById(event.getChatId())
                .orElseThrow(() -> new ChatDomainException("Chat not found"));

        if (!chat.getParticipantIds().contains(currentUserId.toString())) {
            throw new ChatDomainException("You are not a participant in this chat");
        }
        if (event.getStatus() != EventStatus.STARTED) {
            throw new ChatDomainException("This call hasn't started yet");
        }

        return toResponse(event, true);
    }

    public void cancelEvent(String eventId, UUID currentUserId) {
        String userIdStr = currentUserId.toString();
        ScheduledEventDocument event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ChatDomainException("Event not found"));
        ChatDocument chat = chatRepository.findById(event.getChatId())
                .orElseThrow(() -> new ChatDomainException("Chat not found"));

        boolean isCreator = userIdStr.equals(event.getCreatedBy());
        boolean isGroupLeader = chat.getType() == ChatType.GROUP && userIdStr.equals(chat.getLeaderId());
        if (!isCreator && !isGroupLeader) {
            throw new ChatDomainException("Only the scheduler or the group leader can cancel this call");
        }
        if (event.getStatus() == EventStatus.STARTED || event.getStatus() == EventStatus.ENDED) {
            throw new ChatDomainException("Cannot cancel a call that has already started or ended");
        }

        event.setStatus(EventStatus.CANCELED);
        eventRepository.save(event);

        try {
            inAppNotificationService.notifyCanceled(event, chat);
            for (String participantId : chat.getParticipantIds()) {
                if (participantId.equals(userIdStr)) continue;
                emailService.sendEventCanceledEmail(resolveEmail(participantId), event.getTitle());
            }
        } catch (Exception e) {
            log.error("Failed to notify cancellation", e);
        }
    }

    /**
     * Marks an event ENDED once the Jitsi call actually finishes (frontend
     * calls this on the meeting's readyToClose/videoConferenceLeft event).
     * This is what backs the "after conference finish, initiate feedback"
     * requirement — the frontend checks this transition and then shows the
     * feedback flow; the backend just needs an accurate ENDED timestamp.
     */
    public void markEnded(String eventId, UUID currentUserId) {
        ScheduledEventDocument event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ChatDomainException("Event not found"));
        ChatDocument chat = chatRepository.findById(event.getChatId())
                .orElseThrow(() -> new ChatDomainException("Chat not found"));
        if (!chat.getParticipantIds().contains(currentUserId.toString())) {
            throw new ChatDomainException("You are not a participant in this chat");
        }
        if (event.getStatus() != EventStatus.STARTED) {
            return; // already ended/canceled — no-op, avoids clobbering endedAt on repeat calls
        }
        event.setStatus(EventStatus.ENDED);
        event.setEndedAt(Instant.now());
        eventRepository.save(event);
    }

    /**
     * Runs every 30s: flips any SCHEDULED event whose time has arrived to
     * STARTED, fires the "starting now" notification exactly once (guarded
     * by startNotificationSent so restarts/overlapping runs can't double-fire).
     */
    @Scheduled(fixedDelay = 30_000)
    public void pollAndStartDueEvents() {
        List<ScheduledEventDocument> due = eventRepository
                .findByStatusAndScheduledAtLessThanEqualAndStartNotificationSentFalse(EventStatus.SCHEDULED, Instant.now());

        for (ScheduledEventDocument event : due) {
            event.setStatus(EventStatus.STARTED);
            event.setStartedAt(Instant.now());
            event.setStartNotificationSent(true);
            eventRepository.save(event);

            chatRepository.findById(event.getChatId()).ifPresent(chat -> {
                try {
                    inAppNotificationService.notifyStarting(event, chat);
                } catch (Exception e) {
                    log.error("Failed to send in-app starting notification for event {}", event.getId(), e);
                }
                try {
                    for (String participantId : chat.getParticipantIds()) {
                        emailService.sendEventStartingEmail(resolveEmail(participantId), event.getTitle());
                    }
                } catch (Exception e) {
                    log.error("Failed to send starting emails for event {}", event.getId(), e);
                }
            });
        }
    }

    // --- helpers ---

    private void validateSchedule(CreateScheduledEventDto dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new ChatDomainException("A title is required for the scheduled call");
        }
        if (dto.getScheduledAt() == null) {
            throw new ChatDomainException("A scheduled time is required");
        }
        if (!dto.getScheduledAt().isAfter(Instant.now())) {
            throw new ChatDomainException("Scheduled time must be in the future");
        }
        Instant maxAllowed = Instant.now().plus(MAX_MONTHS_AHEAD * 30L, ChronoUnit.DAYS);
        if (dto.getScheduledAt().isAfter(maxAllowed)) {
            throw new ChatDomainException("Cannot schedule more than " + MAX_MONTHS_AHEAD + " months in advance");
        }
    }

    private String resolveEmail(String userId) {
        try {
            return profileService.getProfile(UUID.fromString(userId)).getEmail();
        } catch (Exception e) {
            return null;
        }
    }

    private String buildJitsiRoomName(ScheduledEventDocument event) {
        // Deterministic + unguessable-ish: chat + event id, no spaces/special chars.
        return "skillswap-" + event.getChatId() + "-" + event.getId();
    }

    private ScheduledEventResponse toResponse(ScheduledEventDocument event, boolean includeRoomName) {
        return ScheduledEventResponse.builder()
                .id(event.getId())
                .chatId(event.getChatId())
                .title(event.getTitle())
                .createdBy(event.getCreatedBy())
                .scheduledAt(event.getScheduledAt())
                .status(event.getStatus())
                .startedAt(event.getStartedAt())
                .endedAt(event.getEndedAt())
                .createdAt(event.getCreatedAt())
                .jitsiRoomName(includeRoomName ? buildJitsiRoomName(event) : null)
                .build();
    }
}
