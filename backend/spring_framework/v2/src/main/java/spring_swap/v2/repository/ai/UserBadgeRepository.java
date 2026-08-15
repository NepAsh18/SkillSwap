package spring_swap.v2.repository.ai;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import spring_swap.v2.document.ai.UserBadge;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// repository/UserBadgeRepository.java
@Repository
public interface UserBadgeRepository
        extends MongoRepository<UserBadge, String> {

    Optional<UserBadge> findByUserIdAndSkill(UUID userId, String skill);
    List<UserBadge> findByUserId(UUID userId);

    // For leaderboard later
    List<UserBadge> findBySkillOrderByTotalScoreDesc(String skill);

}
