package spring_swap.v2.services.feedback;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.ai.UserBadge;
import spring_swap.v2.document.feedback.FeedbackDocument;
import spring_swap.v2.dtos.ai.BadgeDto;
import spring_swap.v2.dtos.feedback.FeedbackRequest;
import spring_swap.v2.dtos.feedback.FeedbackResponse;
import spring_swap.v2.exceptions.CooldownException;
import spring_swap.v2.repository.ai.UserBadgeRepository;
import spring_swap.v2.repository.feedback.FeedbackRepository;
import spring_swap.v2.services.ai.BadgeService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final FeedbackRepository feedbackRepo;
    private final BadgeService badgeService;

    // Cooldown window: random between 45 and 50 minutes
    private static final long COOLDOWN_MIN_MINUTES = 45;
    private static final long COOLDOWN_MAX_MINUTES = 50;

    private static final Map<Integer, Double> STAR_WEIGHT = Map.of(
            1, -0.14,
            2, -0.07,
            3,  0.0,
            4, +0.07,
            5, +0.14
    );

    public FeedbackResponse submitFeedback(UUID fromUserId, FeedbackRequest req) {


        if (fromUserId.equals(req.getTargetUserId())) {
            throw new IllegalArgumentException("You cannot submit feedback on yourself");
        }


        feedbackRepo.findTopByFromUserIdAndTargetUserIdAndSkillOrderByCreatedAtDesc(
                fromUserId, req.getTargetUserId(), req.getSkill()
        ).ifPresent(last -> {
            long cooldownMinutes = randomCooldown();
            Instant cooldownExpiry = last.getCreatedAt().plus(cooldownMinutes, ChronoUnit.MINUTES);

            if (Instant.now().isBefore(cooldownExpiry)) {
                long minutesLeft = ChronoUnit.MINUTES.between(Instant.now(), cooldownExpiry);
                throw new CooldownException(
                        "You can submit feedback for this user's " + req.getSkill()
                                + " skill again in " + minutesLeft + " minute(s)"
                );
            }
        });


        double weight = STAR_WEIGHT.getOrDefault(req.getStars(), 0.0);

        // 4. Persist feedback
        FeedbackDocument doc = FeedbackDocument.builder()
                .fromUserId(fromUserId)
                .targetUserId(req.getTargetUserId())
                .skill(req.getSkill())
                .stars(req.getStars())
                .comment(req.getComment())
                .weightApplied(weight)
                .createdAt(Instant.now())
                .build();

        feedbackRepo.save(doc);
        log.info("Feedback saved: from={} to={} skill={} stars={} weight={}",
                fromUserId, req.getTargetUserId(), req.getSkill(), req.getStars(), weight);


        BadgeService.BadgeUpdateResult result = badgeService.applyFeedbackWeight(
                req.getTargetUserId(),
                req.getSkill(),
                weight,
                doc.getId()
        );

        return FeedbackResponse.builder()
                .feedbackId(doc.getId())
                .targetUserId(req.getTargetUserId())
                .skill(req.getSkill())
                .stars(req.getStars())
                .weightApplied(weight)
                .updatedBadge(mapToBadgeDto(result.badge()))
                .createdAt(doc.getCreatedAt())
                .build();
    }

    public List<FeedbackDocument> getFeedbackForUserSkill(
            UUID targetUserId, String skill) {
        return feedbackRepo.findByTargetUserIdAndSkillOrderByCreatedAtDesc(
                targetUserId, skill
        );
    }

    // Random cooldown between 45–50 minutes
    private long randomCooldown() {
        return COOLDOWN_MIN_MINUTES
                + (long)(Math.random() * (COOLDOWN_MAX_MINUTES - COOLDOWN_MIN_MINUTES + 1));
    }

    private BadgeDto mapToBadgeDto(UserBadge badge) {
        return BadgeDto.builder()
                .skill(badge.getSkill())
                .tier(badge.getTier())
                .currentLevel(badge.getCurrentLevel())
                .averageScore(badge.getAverageScore())
                .sessionsCompleted(badge.getSessionsCompleted())
                .updatedAt(badge.getUpdatedAt())
                .build();
    }


}