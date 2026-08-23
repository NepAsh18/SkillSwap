package spring_swap.v2.services.chat;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.chat.ChatDocument;

import java.util.Map;

/**
 * Pushes chat-list updates to a SPECIFIC user (not a whole chat room) —
 * e.g. "you were just added to a group" or "a group you're in was deleted".
 * Call this from ChatService after createGroup / addMember / removeMember /
 * deleteChat so the frontend's chat list refreshes live instead of needing
 * a manual page reload.
 *
 * Frontend subscribes to: /user/queue/chats
 * (Spring translates this automatically to that specific user's private queue —
 * that's what setUserDestinationPrefix("/user") in WebSocketConfig enables.)
 */
@Service
public class ChatNotificationPusher {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatNotificationPusher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyChatListChanged(String userId, ChatDocument chat, String eventType) {
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/chats",
                Map.of("event", eventType, "chat", chat)
        );
    }
}
