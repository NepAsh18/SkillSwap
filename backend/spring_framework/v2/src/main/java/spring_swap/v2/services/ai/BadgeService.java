package spring_swap.v2.services.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.ai.BadgeEvent;
import spring_swap.v2.document.ai.UserBadge;
import spring_swap.v2.repository.ai.UserBadgeRepository;
import spring_swap.v2.services.notification.NotificationService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BadgeService {

    private final UserBadgeRepository badgeRepo;

    @Lazy
    private final NotificationService notificationService;

    // ── Tier progression ─────────────────────────────────────────

    public UserBadge updateBadgeAfterSession(
            UUID userId, String skill,
            int sessionScore, boolean passed,
            int newLevel, String sessionId) {

        UserBadge badge = badgeRepo.findByUserIdAndSkill(userId, skill)
                .orElseGet(() -> createNewBadge(userId, skill));

        String previousTier = badge.getTier();

        badge.setSessionsCompleted(badge.getSessionsCompleted() + 1);
        if (passed) badge.setSessionsPassedCount(badge.getSessionsPassedCount() + 1);
        badge.setTotalScore(badge.getTotalScore() + sessionScore);
        badge.setAverageScore((double) badge.getTotalScore() / badge.getSessionsCompleted());
        badge.setCurrentLevel(newLevel);

        String newTier = computeTier(badge.getAverageScore(), badge.getFeedbackWeight());
        badge.setTier(newTier);
        badge.setUpdatedAt(Instant.now());

        String eventType = newTier.equals(previousTier)
                ? "SESSION_COMPLETED"
                : (isTierHigher(newTier, previousTier) ? "TIER_UPGRADED" : "TIER_DOWNGRADED");

        badge.getHistory().add(BadgeEvent.builder()
                .eventType(eventType)
                .fromTier(previousTier)
                .toTier(newTier)
                .sessionScore(sessionScore)
                .sessionId(sessionId)
                .reason("Assessment completed. Score: " + sessionScore)
                .occurredAt(Instant.now())
                .build());

        UserBadge saved = badgeRepo.save(badge);

        // Notify committee if tier advanced to EXPERT or MASTER
        if (!newTier.equals(previousTier) && isSeniorTier(newTier)) {
            notificationService.notifyCommitteeOfTierAdvancement(
                    userId, skill, newTier, sessionId
            );
        }

        log.info("Badge updated for user={} skill={} tier={} avg={}",
                userId, skill, newTier, badge.getAverageScore());

        return saved;
    }

    // ── Feedback weight ───────────────────────────────────────────

    public record BadgeUpdateResult(UserBadge badge, boolean tierChanged, String newTier) {}

    public BadgeUpdateResult applyFeedbackWeight(
            UUID userId, String skill,
            double weightDelta, String feedbackId) {

        UserBadge badge = badgeRepo.findByUserIdAndSkill(userId, skill)
                .orElseGet(() -> createNewBadge(userId, skill));

        String previousTier = badge.getTier();

        double newFeedbackWeight = Math.max(0.0,
                Math.min(1.0, badge.getFeedbackWeight() + weightDelta)
        );
        badge.setFeedbackWeight(newFeedbackWeight);

        String newTier = computeTier(badge.getAverageScore(), badge.getFeedbackWeight());
        badge.setTier(newTier);
        badge.setUpdatedAt(Instant.now());

        boolean tierChanged = !newTier.equals(previousTier);

        badge.getHistory().add(BadgeEvent.builder()
                .eventType(tierChanged ? "TIER_UPGRADED" : "FEEDBACK_WEIGHT_UPDATED")
                .fromTier(previousTier)
                .toTier(newTier)
                .reason("Feedback applied. Weight delta: " + weightDelta
                        + " | feedbackId: " + feedbackId)
                .occurredAt(Instant.now())
                .build());

        UserBadge saved = badgeRepo.save(badge);

        // Notify committee if tier advanced to EXPERT or MASTER
        if (tierChanged && isSeniorTier(newTier)) {
            notificationService.notifyCommitteeOfTierAdvancement(
                    userId, skill, newTier, null
            );
        }

        log.info("Badge feedback weight updated: user={} skill={} feedbackWeight={} tier={}→{}",
                userId, skill, newFeedbackWeight, previousTier, newTier);

        return new BadgeUpdateResult(saved, tierChanged, newTier);
    }

    // ── Private helpers ───────────────────────────────────────────

    private String computeTier(double averageScore, double feedbackWeight) {
        double effectiveScore = averageScore + ((feedbackWeight - 0.5) * 10.0);
        effectiveScore = Math.max(0, Math.min(100, effectiveScore));

        if (effectiveScore >= 90) return "MASTER";
        if (effectiveScore >= 75) return "EXPERT";
        if (effectiveScore >= 60) return "PRACTITIONER";
        if (effectiveScore >= 40) return "APPRENTICE";
        return "NOVICE";
    }

    private boolean isTierHigher(String newTier, String oldTier) {
        List<String> order = List.of(
                "NOVICE", "APPRENTICE", "PRACTITIONER", "EXPERT", "MASTER"
        );
        return order.indexOf(newTier) > order.indexOf(oldTier);
    }

    private boolean isSeniorTier(String tier) {
        return "EXPERT".equals(tier) || "MASTER".equals(tier);
    }

    private UserBadge createNewBadge(UUID userId, String skill) {
        return UserBadge.builder()
                .userId(userId)
                .skill(skill)
                .tier("NOVICE")
                .currentLevel(1)
                .totalScore(0)
                .sessionsCompleted(0)
                .sessionsPassedCount(0)
                .averageScore(0.0)
                .feedbackUpvotes(0)
                .feedbackDownvotes(0)
                .feedbackWeight(0.5)
                .history(new ArrayList<>())
                .earnedAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }
    public List<UserBadge> getBadgesForUser(UUID userId) {
        return badgeRepo.findByUserId(userId);
    }
}