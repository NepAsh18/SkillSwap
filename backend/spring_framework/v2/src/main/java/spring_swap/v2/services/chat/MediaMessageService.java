package spring_swap.v2.services.chat;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import spring_swap.v2.document.chat.ChatDocument;
import spring_swap.v2.document.chat.MessageDocument;
import spring_swap.v2.document.chat.MessageType;
import spring_swap.v2.dtos.chat.MessageResponse;
import spring_swap.v2.exceptions.ChatDomainException;
import spring_swap.v2.repository.chat.ChatParticipantSettingsRepository;
import spring_swap.v2.repository.chat.ChatRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class MediaMessageService {

    private final MediaStorageService mediaStorageService;
    private final MessageService messageService;
    private final ChatRepository chatRepository;
    private final ChatParticipantSettingsRepository settingsRepository;

    public MediaMessageService(MediaStorageService mediaStorageService,
                               MessageService messageService,
                               ChatRepository chatRepository,
                               ChatParticipantSettingsRepository settingsRepository) {
        this.mediaStorageService = mediaStorageService;
        this.messageService = messageService;
        this.chatRepository = chatRepository;
        this.settingsRepository = settingsRepository;
    }

    public MessageResponse uploadAndSend(String chatId, UUID senderId, MultipartFile file,
                                         MessageType type, Boolean temporaryOverride,
                                         Long durationMinutesOverride) {
        String senderIdStr = senderId.toString();
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatDomainException("Chat not found"));
        if (!chat.getParticipantIds().contains(senderIdStr)) {
            throw new ChatDomainException("You are not a participant in this chat");
        }
        if (type == MessageType.TEXT) {
            throw new ChatDomainException("Use the text-message endpoint for TEXT content");
        }

        MediaStorageService.StoredFile stored = mediaStorageService.store(chatId, file, type);

        boolean temporary = temporaryOverride != null
                ? temporaryOverride
                : settingsRepository.findByChatIdAndUserId(chatId, senderIdStr)
                .map(s -> s.isTemporaryDefault())
                .orElse(false);

        Instant expiresAt = null;
        if (temporary) {
            Long durationMinutes = durationMinutesOverride != null
                    ? durationMinutesOverride
                    : settingsRepository.findByChatIdAndUserId(chatId, senderIdStr)
                    .map(s -> s.getTemporaryDurationMinutes())
                    .orElse(null);
            if (durationMinutes == null || durationMinutes <= 0) {
                throw new ChatDomainException("A temporary message needs a valid duration");
            }
            expiresAt = Instant.now().plus(durationMinutes, ChronoUnit.MINUTES);
        }

        MessageDocument message = MessageDocument.builder()
                .chatId(chatId)
                .senderId(senderIdStr)
                .type(type)
                .mediaUrl("/api/v1/chats/" + chatId + "/media/" + stored.relativePath().substring(chatId.length() + 1))
                .mediaFileName(stored.fileName())
                .mediaSizeBytes(stored.sizeBytes())
                .temporary(temporary)
                .expiresAt(expiresAt)
                .createdAt(Instant.now())
                .build();

        return messageService.saveBuiltMessage(message);
    }
}