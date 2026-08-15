package spring_swap.v2.dtos.feedback;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import spring_swap.v2.dtos.ai.BadgeDto;

import java.time.Instant;
import java.util.UUID;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {
    private String feedbackId;
    private UUID targetUserId;
    private String skill;
    private int stars;
    private double weightApplied;
    private BadgeDto updatedBadge;
    private Instant createdAt;
}