package spring_swap.v2.document.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

// document/BadgeEvent.java  (embedded in UserBadge)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeEvent {
    private String eventType;       // SESSION_COMPLETED | FEEDBACK_RECEIVED | TIER_UPGRADED | TIER_DOWNGRADED
    private String fromTier;
    private String toTier;
    private Integer sessionScore;
    private String sessionId;
    private String reason;
    private Instant occurredAt;
}