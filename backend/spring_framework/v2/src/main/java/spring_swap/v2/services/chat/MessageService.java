package spring_swap.v2.services.chat;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.chat.ChatDocument;
import spring_swap.v2.document.chat.ChatParticipantSettingsDocument;
import spring_swap.v2.document.chat.MessageDocument;
import spring_swap.v2.document.chat.MessageType;
import spring_swap.v2.dtos.chat.MessageResponse;
import spring_swap.v2.dtos.chat.SendMessageDto;
import spring_swap.v2.exceptions.ChatDomainException;
import spring_swap.v2.repository.chat.ChatParticipantSettingsRepository;
import spring_swap.v2.repository.chat.ChatRepository;
import spring_swap.v2.repository.chat.MessageRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class MessageService {

    private static final int DEFAULT_PAGE_SIZE = 30;

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final ChatParticipantSettingsRepository settingsRepository;
    private final MediaStorageService mediaStorageService;

    public MessageService(MessageRepository messageRepository,
                          ChatRepository chatRepository,
                          ChatParticipantSettingsRepository settingsRepository,
                          MediaStorageService mediaStorageService) {
        this.messageRepository = messageRepository;
        this.chatRepository = chatRepository;
        this.settingsRepository = settingsRepository;
        this.mediaStorageService = mediaStorageService;
    }

    /** Plain text message. Media messages go through MediaMessageService. */
    public MessageResponse sendText(String chatId, UUID senderId, SendMessageDto dto) {
        String senderIdStr = senderId.toString();
        ChatDocument chat = assertParticipant(chatId, senderIdStr);

        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new ChatDomainException("Message content cannot be empty");
        }

        // A reply must point at a real message in this same chat — otherwise
        // silently drop the reference rather than fail the whole send.
        String replyToId = null;
        if (dto.getReplyToMessageId() != null && !dto.getReplyToMessageId().isBlank()) {
            replyToId = messageRepository.findById(dto.getReplyToMessageId())
                    .filter(m -> m.getChatId().equals(chatId))
                    .map(MessageDocument::getId)
                    .orElse(null);
        }

        boolean temporary = resolveTemporaryFlag(chatId, senderIdStr, dto.getTemporary());
        Instant expiresAt = null;

        if (temporary) {
            Long durationMinutes = dto.getTemporaryDurationMinutes();
            if (durationMinutes == null) {
                durationMinutes = resolveDefaultDuration(chatId, senderIdStr);
            }
            if (durationMinutes == null || durationMinutes <= 0) {
                throw new ChatDomainException("A temporary message needs a valid duration");
            }
            expiresAt = Instant.now().plus(durationMinutes, ChronoUnit.MINUTES);
        }

        MessageDocument message = MessageDocument.builder()
                .chatId(chatId)
                .senderId(senderIdStr)
                .type(MessageType.TEXT)
                .content(dto.getContent())
                .temporary(temporary)
                .expiresAt(expiresAt)
                .replyToMessageId(replyToId)
                .createdAt(Instant.now())
                .build();

        message = messageRepository.save(message);
        touchChatPreview(chat, message);

        return toResponse(message);
    }

    /**
     * Saves a pre-built MessageDocument (used by the media layer once a file
     * is stored to disk) and applies the same chat-preview bookkeeping as
     * sendText().
     */
    public MessageResponse saveBuiltMessage(MessageDocument message) {
        ChatDocument chat = assertParticipant(message.getChatId(), message.getSenderId());
        message = messageRepository.save(message);
        touchChatPreview(chat, message);
        return toResponse(message);
    }

    public List<MessageResponse> getMessages(String chatId, UUID currentUserId, int page, Integer pageSize) {
        assertParticipant(chatId, currentUserId.toString());

        int size = (pageSize == null || pageSize <= 0) ? DEFAULT_PAGE_SIZE : pageSize;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        List<MessageDocument> messages = messageRepository.findByChatIdOrderByCreatedAtDesc(chatId, pageable);
        Collections.reverse(messages); // oldest-first for chat UI rendering

        return messages.stream().map(this::toResponse).toList();
    }

    /**
     * Media browser: all IMAGE/VIDEO/DOC messages in a chat, optionally
     * filtered by filename substring. Backs the "Files" page's type toggle
     * + search bar.
     */
    public List<MessageResponse> getMediaMessages(String chatId, UUID currentUserId, MessageType type, String query) {
        assertParticipant(chatId, currentUserId.toString());

        List<MessageDocument> messages = (query == null || query.isBlank())
                ? messageRepository.findByChatIdAndTypeOrderByCreatedAtDesc(chatId, type)
                : messageRepository.findByChatIdAndTypeAndMediaFileNameContainingIgnoreCaseOrderByCreatedAtDesc(chatId, type, query);

        return messages.stream().map(this::toResponse).toList();
    }

    /** Marks all messages up to "now" as read for this user (simple last-read-timestamp model). */
    public void markAsRead(String chatId, UUID currentUserId) {
        String userIdStr = currentUserId.toString();
        assertParticipant(chatId, userIdStr);

        ChatParticipantSettingsDocument settings = settingsRepository
                .findByChatIdAndUserId(chatId, userIdStr)
                .orElseThrow(() -> new ChatDomainException("Chat settings not initialized for this user"));

        settings.setLastReadAt(Instant.now());
        settings.setUpdatedAt(Instant.now());
        settingsRepository.save(settings);
    }

    /**
     * Records that a specific message was seen (for per-message seen ticks,
     * as opposed to the coarser markAsRead last-read-timestamp above). Called
     * from the WebSocket layer on a "seen" event.
     */
    public MessageResponse markMessageSeen(String messageId, UUID currentUserId) {
        MessageDocument message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ChatDomainException("Message not found"));
        assertParticipant(message.getChatId(), currentUserId.toString());

        message.getSeenBy().putIfAbsent(currentUserId.toString(), Instant.now());
        message = messageRepository.save(message);
        return toResponse(message);
    }

    /**
     * Toggles a reaction: if this user already reacted with this exact emoji,
     * it's removed (un-react). If they reacted with a different emoji, it's
     * replaced. Otherwise it's added. Returns the updated message so the
     * caller can broadcast the new reactions map to everyone in the chat.
     */
    public MessageResponse toggleReaction(String chatId, String messageId, UUID currentUserId, String emoji) {
        String userIdStr = currentUserId.toString();
        assertParticipant(chatId, userIdStr);

        if (emoji == null || emoji.isBlank()) {
            throw new ChatDomainException("Reaction emoji cannot be empty");
        }

        MessageDocument message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ChatDomainException("Message not found"));
        if (!message.getChatId().equals(chatId)) {
            throw new ChatDomainException("Message does not belong to this chat");
        }
        if (message.isDeleted()) {
            throw new ChatDomainException("Cannot react to a deleted message");
        }

        String existing = message.getReactions().get(userIdStr);
        if (emoji.equals(existing)) {
            message.getReactions().remove(userIdStr);
        } else {
            message.getReactions().put(userIdStr, emoji);
        }

        message = messageRepository.save(message);
        return toResponse(message);
    }

    /**
     * Soft-deletes a message: clears content/media but keeps the row so
     * ordering, timestamps, and seenBy history survive. Only the original
     * sender can delete their own message. If the message had media, the
     * underlying file on disk is removed too. If it was the chat's last
     * message, the chat preview is refreshed to the newest remaining
     * non-deleted message.
     */
    public MessageResponse deleteMessage(String chatId, String messageId, UUID currentUserId) {
        String userIdStr = currentUserId.toString();
        ChatDocument chat = assertParticipant(chatId, userIdStr);

        MessageDocument message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ChatDomainException("Message not found"));

        if (!message.getChatId().equals(chatId)) {
            throw new ChatDomainException("Message does not belong to this chat");
        }
        if (!message.getSenderId().equals(userIdStr)) {
            throw new ChatDomainException("You can only delete your own messages");
        }
        if (message.isDeleted()) {
            return toResponse(message); // idempotent — already deleted
        }

        if (message.getType() != MessageType.TEXT && message.getMediaUrl() != null) {
            deleteMediaFileForMessage(chatId, message.getMediaUrl());
        }

        message.setDeleted(true);
        message.setDeletedAt(Instant.now());
        message.setContent(null);
        message.setMediaUrl(null);
        message.setMediaFileName(null);
        message.setMediaSizeBytes(null);
        message = messageRepository.save(message);

        refreshChatPreviewIfLastMessage(chat, message);

        return toResponse(message);
    }

    public void updateSettings(String chatId, UUID currentUserId, Boolean temporaryDefault, Long durationMinutes) {
        String userIdStr = currentUserId.toString();
        assertParticipant(chatId, userIdStr);

        ChatParticipantSettingsDocument settings = settingsRepository
                .findByChatIdAndUserId(chatId, userIdStr)
                .orElseThrow(() -> new ChatDomainException("Chat settings not initialized for this user"));

        if (temporaryDefault != null) {
            settings.setTemporaryDefault(temporaryDefault);
        }
        if (durationMinutes != null) {
            settings.setTemporaryDurationMinutes(durationMinutes);
        }
        settings.setUpdatedAt(Instant.now());
        settingsRepository.save(settings);
    }

    // --- helpers ---

    private ChatDocument assertParticipant(String chatId, String userId) {
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatDomainException("Chat not found"));
        if (!chat.getParticipantIds().contains(userId)) {
            throw new ChatDomainException("You are not a participant in this chat");
        }
        return chat;
    }

    private boolean resolveTemporaryFlag(String chatId, String userId, Boolean override) {
        if (override != null) {
            return override;
        }
        return settingsRepository.findByChatIdAndUserId(chatId, userId)
                .map(ChatParticipantSettingsDocument::isTemporaryDefault)
                .orElse(false);
    }

    private Long resolveDefaultDuration(String chatId, String userId) {
        return settingsRepository.findByChatIdAndUserId(chatId, userId)
                .map(ChatParticipantSettingsDocument::getTemporaryDurationMinutes)
                .orElse(null);
    }

    private void touchChatPreview(ChatDocument chat, MessageDocument message) {
        chat.setLastMessageAt(message.getCreatedAt());
        String preview = message.getType() == MessageType.TEXT
                ? truncate(message.getContent(), 80)
                : "[" + message.getType().name().toLowerCase() + "]";
        chat.setLastMessagePreview(preview);
        chatRepository.save(chat);
    }

    private void refreshChatPreviewIfLastMessage(ChatDocument chat, MessageDocument deleted) {
        if (chat.getLastMessageAt() == null || !chat.getLastMessageAt().equals(deleted.getCreatedAt())) {
            return;
        }

        Pageable lookback = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<MessageDocument> candidates = messageRepository.findByChatIdOrderByCreatedAtDesc(chat.getId(), lookback);
        MessageDocument newest = candidates.stream().filter(m -> !m.isDeleted()).findFirst().orElse(null);

        if (newest == null) {
            chat.setLastMessageAt(null);
            chat.setLastMessagePreview(null);
        } else {
            chat.setLastMessageAt(newest.getCreatedAt());
            chat.setLastMessagePreview(newest.getType() == MessageType.TEXT
                    ? truncate(newest.getContent(), 80)
                    : "[" + newest.getType().name().toLowerCase() + "]");
        }
        chatRepository.save(chat);
    }

    /**
     * mediaUrl on the document is stored as a servable API path
     * ("/api/v1/chats/{chatId}/media/images/{uuid}.jpg"), not the relative
     * disk path MediaStorageService expects ("{chatId}/images/{uuid}.jpg").
     * Strip the API prefix back down before handing off to storage cleanup.
     */
    private void deleteMediaFileForMessage(String chatId, String mediaUrl) {
        String marker = "/media/";
        int idx = mediaUrl.indexOf(marker);
        if (idx < 0) return;
        String subpath = mediaUrl.substring(idx + marker.length());
        mediaStorageService.deleteOne(chatId + "/" + subpath);
    }

    private String truncate(String text, int max) {
        if (text == null) return null;
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }

    private MessageResponse toResponse(MessageDocument m) {
        return MessageResponse.builder()
                .id(m.getId())
                .chatId(m.getChatId())
                .senderId(m.getSenderId())
                .type(m.getType())
                .content(m.getContent())
                .mediaUrl(m.getMediaUrl())
                .mediaFileName(m.getMediaFileName())
                .mediaSizeBytes(m.getMediaSizeBytes())
                .temporary(m.isTemporary())
                .expiresAt(m.getExpiresAt())
                .seenBy(m.getSeenBy())
                .edited(m.isEdited())
                .editedAt(m.getEditedAt())
                .deleted(m.isDeleted())
                .deletedAt(m.getDeletedAt())
                .replyToMessageId(m.getReplyToMessageId())
                .reactions(m.getReactions())
                .createdAt(m.getCreatedAt())
                .build();
    }
}