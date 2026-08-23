package spring_swap.v2.repository.chat;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import spring_swap.v2.document.chat.MessageDocument;
import spring_swap.v2.document.chat.MessageType;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends MongoRepository<MessageDocument, String> {
    // Newest-first page; service layer reverses for display if needed.
    List<MessageDocument> findByChatIdOrderByCreatedAtDesc(String chatId, Pageable pageable);

    long countByChatId(String chatId);

    // Unread count: messages in this chat created after the user's last-read timestamp.
    long countByChatIdAndCreatedAtAfter(String chatId, java.time.Instant after);

    // Media browser: all messages of a given type (IMAGE/VIDEO/DOC) in a chat, newest first.
    List<MessageDocument> findByChatIdAndTypeOrderByCreatedAtDesc(String chatId, MessageType type);

    // Media browser with search: filters mediaFileName by a case-insensitive substring.
    List<MessageDocument> findByChatIdAndTypeAndMediaFileNameContainingIgnoreCaseOrderByCreatedAtDesc(
            String chatId, MessageType type, String query);

    // Resolves a served file's on-disk subpath (e.g. "images/{uuid}.jpg") back
    // to the message that owns it, so downloads can use the original uploaded
    // filename instead of the anonymous UUID stored on disk.
    Optional<MessageDocument> findByChatIdAndMediaUrlEndingWith(String chatId, String mediaUrlSuffix);

    void deleteByChatId(String chatId); // used on chat/group deletion cascade
}