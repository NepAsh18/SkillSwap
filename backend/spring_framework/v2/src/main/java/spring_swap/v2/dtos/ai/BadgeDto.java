package spring_swap.v2.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

// dto/ai/BadgeDto.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeDto {
    private String skill;
    private String tier;
    private int currentLevel;
    private double averageScore;
    private int sessionsCompleted;
    private Instant updatedAt;
}