package spring_swap.v2.document.ai;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.UUID;


@Document(collection = "user_badges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBadge {

    @Id
    private String id;

    private UUID userId;          // Postgres user UUID
    private String skill;

    private String tier;            // NOVICE | APPRENTICE | PRACTITIONER | EXPERT | MASTER
    private int currentLevel;       // 1–5
    private int totalScore;         // cumulative across all sessions
    private int sessionsCompleted;
    private int sessionsPassedCount;
    private double averageScore;

    // Badge auto-update space — fields that feedback will increment
    private int feedbackUpvotes;        // positive peer feedback received
    private int feedbackDownvotes;
    private double feedbackWeight;      // computed: upvotes / (upvotes + downvotes)

    // Full history for audit trail
    private List<BadgeEvent> history;

    private Instant earnedAt;       // when this tier was first achieved
    private Instant updatedAt;
}