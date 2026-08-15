package spring_swap.v2.repository.ai;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import spring_swap.v2.document.ai.AssessmentSession;

import java.util.List;
import java.util.UUID;


@Repository
public interface AssessmentSessionRepository
        extends MongoRepository<AssessmentSession, String> {

    List<AssessmentSession> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<AssessmentSession> findByUserIdAndSkill(UUID userId, String skill);
    List<AssessmentSession> findByUserIdAndStatus(UUID userId, String status);
}