package spring_swap.v2.repository.chat;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import spring_swap.v2.document.chat.ChatDocument;

import java.util.List;
import java.util.Optional;

public interface ChatRepository extends MongoRepository<ChatDocument, String> {

    // For lazy-create: find existing DIRECT chat with exactly these two participants.
    // $size guards against ever matching a stray non-2-person DIRECT doc.
    @Query("{ 'type': 'DIRECT', 'participantIds': { $all: [?0, ?1], $size: 2 } }")
    Optional<ChatDocument> findDirectChatBetween(String userIdA, String userIdB);

    // Chat list for a user, most recent activity first.
    List<ChatDocument> findByParticipantIdsContainingOrderByLastMessageAtDesc(String userId);
}
