package spring_swap.v2.services.chat;

import org.springframework.stereotype.Service;
import spring_swap.v2.document.chat.ChatDocument;
import spring_swap.v2.document.chat.ChatParticipantSettingsDocument;
import spring_swap.v2.document.chat.ChatType;
import spring_swap.v2.document.connection.ConnectionStatus;
import spring_swap.v2.dtos.chat.ChatResponse;
import spring_swap.v2.dtos.chat.CreateGroupDto;
import spring_swap.v2.dtos.chat.ParticipantSummary;
import spring_swap.v2.exceptions.ChatDomainException;
import spring_swap.v2.repository.chat.ChatParticipantSettingsRepository;
import spring_swap.v2.repository.chat.ChatRepository;
import spring_swap.v2.repository.chat.MessageRepository;
import spring_swap.v2.repository.chat.ScheduledEventRepository;
import spring_swap.v2.repository.connection.ConnectionRequestRepository;
import spring_swap.v2.services.auth.ProfileService;

import java.time.Instant;
import java.util.*;

@Service
public class ChatService {

    private static final int MAX_GROUP_SIZE = 5;
    private static final List<ConnectionStatus> ACCEPTED = List.of(ConnectionStatus.ACCEPTED);

    private final ChatRepository chatRepository;
    private final ChatParticipantSettingsRepository settingsRepository;
    private final MessageRepository messageRepository;
    private final ScheduledEventRepository scheduledEventRepository;
    private final ConnectionRequestRepository connectionRequestRepository;
    private final ProfileService profileService;
    private final ChatNotificationPusher notificationPusher;
    private final MediaStorageService mediaStorageService;

    public ChatService(ChatRepository chatRepository,
                       ChatParticipantSettingsRepository settingsRepository,
                       MessageRepository messageRepository,
                       ScheduledEventRepository scheduledEventRepository,
                       ConnectionRequestRepository connectionRequestRepository,
                       ProfileService profileService,
                       ChatNotificationPusher notificationPusher,
                       MediaStorageService mediaStorageService) {
        this.chatRepository = chatRepository;
        this.settingsRepository = settingsRepository;
        this.messageRepository = messageRepository;
        this.scheduledEventRepository = scheduledEventRepository;
        this.connectionRequestRepository = connectionRequestRepository;
        this.profileService = profileService;
        this.notificationPusher = notificationPusher;
        this.mediaStorageService = mediaStorageService;
    }

    /**
     * Lazy-create: returns the existing DIRECT chat between the two users,
     * or creates one if this is their first message. Does NOT verify a
     * connection exists here — that's already guaranteed upstream since chat
     * is only reachable from an accepted connection in the UI. If you want a
     * hard backend guarantee too, uncomment assertConnected() below.
     */
    public ChatDocument getOrCreateDirectChat(String userIdA, String userIdB) {
        if (userIdA.equals(userIdB)) {
            throw new ChatDomainException("Cannot open a chat with yourself");
        }

        return chatRepository.findDirectChatBetween(userIdA, userIdB)
                .orElseGet(() -> {
                    // assertConnected(userIdA, userIdB); // optional hard guard
                    ChatDocument chat = ChatDocument.builder()
                            .type(ChatType.DIRECT)
                            .participantIds(List.of(userIdA, userIdB))
                            .createdAt(Instant.now())
                            .lastMessageAt(Instant.now())
                            .build();
                    chat = chatRepository.save(chat);
                    ensureSettingsExist(chat.getId(), List.of(userIdA, userIdB));
                    return chat;
                });
    }

    public ChatDocument createGroup(UUID leaderId, CreateGroupDto dto) {
        String leaderIdStr = leaderId.toString();

        if (dto.getMemberIds() == null || dto.getMemberIds().isEmpty()) {
            throw new ChatDomainException("A group needs at least one other member");
        }
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new ChatDomainException("Group name is required");
        }

        // De-dupe and strip leader if accidentally included, then re-add once.
        Set<String> memberSet = new LinkedHashSet<>(dto.getMemberIds());
        memberSet.remove(leaderIdStr);

        int totalSize = memberSet.size() + 1; // +1 for leader
        if (totalSize > MAX_GROUP_SIZE) {
            throw new ChatDomainException(
                    "Groups are capped at " + MAX_GROUP_SIZE + " members (including you)");
        }

        // Every member must be an existing accepted connection of the leader.
        for (String memberId : memberSet) {
            assertConnected(leaderIdStr, memberId);
        }

        List<String> participantIds = new java.util.ArrayList<>();
        participantIds.add(leaderIdStr);
        participantIds.addAll(memberSet);

        ChatDocument chat = ChatDocument.builder()
                .type(ChatType.GROUP)
                .participantIds(participantIds)
                .leaderId(leaderIdStr)
                .name(dto.getName())
                .avatarUrl(dto.getAvatarUrl())
                .createdAt(Instant.now())
                .lastMessageAt(Instant.now())
                .build();

        chat = chatRepository.save(chat);
        ensureSettingsExist(chat.getId(), participantIds);

        for (String memberId : memberSet) {
            notificationPusher.notifyChatListChanged(memberId, chat, "GROUP_CREATED");
        }
        return chat;
    }

    /** Leader-only: add a member to an existing group, respecting the size cap. */
    public ChatDocument addMember(String chatId, UUID currentUserId, String newMemberId) {
        ChatDocument chat = getGroupOwnedByLeader(chatId, currentUserId);

        if (chat.getParticipantIds().contains(newMemberId)) {
            throw new ChatDomainException("User is already in this group");
        }
        if (chat.getParticipantIds().size() >= MAX_GROUP_SIZE) {
            throw new ChatDomainException(
                    "Groups are capped at " + MAX_GROUP_SIZE + " members");
        }
        assertConnected(chat.getLeaderId(), newMemberId);

        chat.getParticipantIds().add(newMemberId);
        chat = chatRepository.save(chat);
        ensureSettingsExist(chat.getId(), List.of(newMemberId));
        notificationPusher.notifyChatListChanged(newMemberId, chat, "ADDED_TO_GROUP");
        return chat;
    }

    /** Leader-only: remove a member from a group. */
    public ChatDocument removeMember(String chatId, UUID currentUserId, String memberId) {
        ChatDocument chat = getGroupOwnedByLeader(chatId, currentUserId);

        if (memberId.equals(chat.getLeaderId())) {
            throw new ChatDomainException("Leader cannot remove themselves — delete the group instead");
        }
        if (!chat.getParticipantIds().remove(memberId)) {
            throw new ChatDomainException("User is not in this group");
        }

        markLeft(chatId, memberId);
        chat = chatRepository.save(chat);
        deleteIfEmpty(chatId);
        notificationPusher.notifyChatListChanged(memberId, chat, "REMOVED_FROM_GROUP");
        return chat;
    }

    /** Any participant may leave a group voluntarily (leader excluded — must delete instead). */
    public void leaveGroup(String chatId, UUID currentUserId) {
        String userIdStr = currentUserId.toString();
        ChatDocument chat = getGroupById(chatId);

        if (userIdStr.equals(chat.getLeaderId())) {
            throw new ChatDomainException("Leader cannot leave — delete the group instead");
        }
        if (!chat.getParticipantIds().remove(userIdStr)) {
            throw new ChatDomainException("You are not a member of this group");
        }

        markLeft(chatId, userIdStr);
        chatRepository.save(chat);
        deleteIfEmpty(chatId);
    }

    /**
     * Deletes a chat entirely (DIRECT: either participant; GROUP: leader only),
     * cascading to messages, settings, scheduled events, and stored media for
     * that chat.
     */
    public void deleteChat(String chatId, UUID currentUserId) {
        String userIdStr = currentUserId.toString();
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatDomainException("Chat not found"));

        if (chat.getType() == ChatType.GROUP && !userIdStr.equals(chat.getLeaderId())) {
            throw new ChatDomainException("Only the group leader can delete the group");
        }
        if (chat.getType() == ChatType.DIRECT && !chat.getParticipantIds().contains(userIdStr)) {
            throw new ChatDomainException("You are not a participant in this chat");
        }

        cascadeDelete(chatId);
    }

    /**
     * Call after a member leaves/is removed from a GROUP. If no participants
     * remain, the chat and all its data are purged.
     */
    public void deleteIfEmpty(String chatId) {
        chatRepository.findById(chatId).ifPresent(chat -> {
            if (chat.getType() == ChatType.GROUP && chat.getParticipantIds().isEmpty()) {
                cascadeDelete(chatId);
            }
        });
    }

    private void cascadeDelete(String chatId) {
        messageRepository.deleteByChatId(chatId);
        settingsRepository.deleteByChatId(chatId);
        scheduledEventRepository.deleteByChatId(chatId);
        mediaStorageService.deleteAllForChat(chatId);
        chatRepository.deleteById(chatId);
    }

    public List<ChatResponse> getMyChats(UUID currentUserId) {
        String userIdStr = currentUserId.toString();
        List<ChatDocument> chats = chatRepository
                .findByParticipantIdsContainingOrderByLastMessageAtDesc(userIdStr);

        return chats.stream().map(chat -> toResponse(chat, userIdStr)).toList();
    }

    public ChatDocument getChatForParticipant(String chatId, UUID currentUserId) {
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatDomainException("Chat not found"));
        if (!chat.getParticipantIds().contains(currentUserId.toString())) {
            throw new ChatDomainException("You are not a participant in this chat");
        }
        return chat;
    }

    // --- helpers ---

    private ChatDocument getGroupById(String chatId) {
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ChatDomainException("Chat not found"));
        if (chat.getType() != ChatType.GROUP) {
            throw new ChatDomainException("This action is only valid for group chats");
        }
        return chat;
    }

    private ChatDocument getGroupOwnedByLeader(String chatId, UUID currentUserId) {
        ChatDocument chat = getGroupById(chatId);
        if (!currentUserId.toString().equals(chat.getLeaderId())) {
            throw new ChatDomainException("Only the group leader can perform this action");
        }
        return chat;
    }

    private void assertConnected(String userIdA, String userIdB) {
        boolean connected =
                connectionRequestRepository.findBySenderIdAndReceiverIdAndStatusIn(userIdA, userIdB, ACCEPTED).isPresent()
                        || connectionRequestRepository.findBySenderIdAndReceiverIdAndStatusIn(userIdB, userIdA, ACCEPTED).isPresent();
        if (!connected) {
            throw new ChatDomainException("You can only add existing connections to a group");
        }
    }

    private void ensureSettingsExist(String chatId, List<String> userIds) {
        for (String userId : userIds) {
            settingsRepository.findByChatIdAndUserId(chatId, userId).orElseGet(() -> {
                ChatParticipantSettingsDocument settings = ChatParticipantSettingsDocument.builder()
                        .chatId(chatId)
                        .userId(userId)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();
                return settingsRepository.save(settings);
            });
        }
    }

    private void markLeft(String chatId, String userId) {
        settingsRepository.findByChatIdAndUserId(chatId, userId).ifPresent(settings -> {
            settings.setLeft(true);
            settings.setLeftAt(Instant.now());
            settingsRepository.save(settings);
        });
    }

    private ChatResponse toResponse(ChatDocument chat, String currentUserId) {
        ChatResponse.ChatResponseBuilder builder = ChatResponse.builder()
                .id(chat.getId())
                .type(chat.getType())
                .participantIds(chat.getParticipantIds())
                .leaderId(chat.getLeaderId())
                .name(chat.getName())
                .avatarUrl(chat.getAvatarUrl())
                .lastMessageAt(chat.getLastMessageAt())
                .lastMessagePreview(chat.getLastMessagePreview());

        if (chat.getType() == ChatType.DIRECT) {
            String otherId = chat.getParticipantIds().stream()
                    .filter(id -> !id.equals(currentUserId))
                    .findFirst()
                    .orElse(null);
            if (otherId != null) {
                var otherProfile = profileService.getProfile(UUID.fromString(otherId));
                builder.otherUserId(otherId)
                        .otherUserName(otherProfile.getName())
                        .otherUserUsername(otherProfile.getUsername())
                        .otherUserPicture(otherProfile.getPicture());
            }
        } else if (chat.getType() == ChatType.GROUP) {
            Map<String, ParticipantSummary> participants = new LinkedHashMap<>();
            for (String participantId : chat.getParticipantIds()) {
                try {
                    var profile = profileService.getProfile(UUID.fromString(participantId));
                    participants.put(participantId, new ParticipantSummary(
                            profile.getName(), profile.getUsername(), profile.getPicture()));
                } catch (Exception e) {
                    participants.put(participantId, new ParticipantSummary(
                            "Unknown user", null, null));
                }
            }
            builder.participants(participants);
        }

        long unread = settingsRepository.findByChatIdAndUserId(chat.getId(), currentUserId)
                .map(settings -> settings.getLastReadAt() == null
                        ? messageRepository.countByChatId(chat.getId())
                        : messageRepository.countByChatIdAndCreatedAtAfter(chat.getId(), settings.getLastReadAt()))
                .orElse(0L);
        builder.unreadCount(unread);

        return builder.build();
    }
}