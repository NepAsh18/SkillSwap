package spring_swap.v2.domain;

import java.util.Set;

public record ScoringContext(
        Set<String> seekerTeaches,
        Set<String> seekerLearns,
        Set<String> candidateTeaches,
        Set<String> candidateLearns,
        String candidateTopBadgeTier,
        double candidateBadgeAvgScore,   // 0-100
        double candidateAssessmentAvg,   // 0-100, or -1 if no record
        double adjacencyStrength         // 1.0 = exact skill match, else NPMI in [0,1] for the best adjacent-skill match found
) {
}