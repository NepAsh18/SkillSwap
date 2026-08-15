package spring_swap.v2.dtos.match;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.Set;
import java.util.UUID;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResultDto {
    private UUID userId;
    private String username;
    private String name;
    private String picture;
    private String bio;

    private Set<String> skillsProficient;
    private Set<String> skillsToLearn;

    private String topBadgeTier;

    private double finalScore;              // 0-1, already sorted desc by caller
    private Map<String, Double> breakdown;   // tokenMatch, jaccard, badgeTier, aiAssessment, mutualBenefit, final

    // 1.0 = candidate teaches an exact skill the seeker wants to learn.
    // < 1.0 = candidate surfaced via a correlated/adjacent skill (NPMI-derived).
    // Used server-side to split results into "top matches" vs "you might also like".
    private double adjacencyStrength;
}