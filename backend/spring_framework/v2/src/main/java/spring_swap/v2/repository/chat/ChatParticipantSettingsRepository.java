package spring_swap.v2.repository.chat;

import org.springframework.data.mongodb.repository.MongoRepository;
import spring_swap.v2.document.chat.ChatParticipantSettingsDocument;

import java.util.List;
import java.util.Optional;

public interface ChatParticipantSettingsRepository extends MongoRepository<ChatParticipantSettingsDocument, String> {

    Optional<ChatParticipantSettingsDocument> findByChatIdAndUserId(String chatId, String userId);

    List<ChatParticipantSettingsDocument> findByChatId(String chatId);

    void deleteByChatId(String chatId); // cascade on chat/group deletion
}
