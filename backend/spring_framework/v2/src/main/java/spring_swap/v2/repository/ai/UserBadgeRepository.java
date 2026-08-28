package spring_swap.v2.repository.ai;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import spring_swap.v2.document.ai.UserBadge;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBadgeRepository extends MongoRepository<UserBadge, String> {

    Optional<UserBadge> findByUserIdAndSkill(UUID userId, String skill);
    List<UserBadge> findByUserId(UUID userId);
    List<UserBadge> findByUserIdIn(List<UUID> userIds);
    List<UserBadge> findBySkillOrderByTotalScoreDesc(String skill);

    // New: tier/level filtering
    List<UserBadge> findByTier(String tier);
    List<UserBadge> findByCurrentLevel(int currentLevel);
    List<UserBadge> findByTierAndCurrentLevel(String tier, int currentLevel);

    //Get APIS

    List<UserBadge> findTop50ByOrderByCurrentLevelDescTotalScoreDesc();

    List<UserBadge> findTop50BySkillOrderByCurrentLevelDescTotalScoreDesc(String skill);

}