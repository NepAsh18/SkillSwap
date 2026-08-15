package spring_swap.v2.repository.feedback;


import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import spring_swap.v2.document.feedback.FeedbackDocument;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedbackRepository
        extends MongoRepository<FeedbackDocument, String> {


    Optional<FeedbackDocument> findTopByFromUserIdAndTargetUserIdAndSkillOrderByCreatedAtDesc(
            UUID fromUserId,  UUID targetUserId, String skill
    );


    List<FeedbackDocument> findByTargetUserIdAndSkillOrderByCreatedAtDesc(
            UUID targetUserId, String skill
    );


    List<FeedbackDocument> findByFromUserIdOrderByCreatedAtDesc(UUID fromUserId);
}
