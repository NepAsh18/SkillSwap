package spring_swap.v2.dtos.ai;

import java.util.UUID;

public record BadgeRankingDTO(
        int rank,
        UUID userId,
        String userName,       // filled in from Postgres User lookup
        String skill,
        String tier,
        int currentLevel,
        int totalScore,
        double averageScore
) {}