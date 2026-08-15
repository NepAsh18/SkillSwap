package spring_swap.v2.dtos.match;



import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfileDto {
    private UUID id;
    private String username;
    private String name;
    private String picture;
    private String bio;

    private Set<String> skillsProficient;
    private Set<String> skillsToLearn;

    private String topBadgeTier;      // e.g. "EXPERT" — derived from BadgeDto list, max tier
    private double badgeAvgScore;     // 0-100, averaged across relevant BadgeDto entries

    private double aiAssessmentAvg;   // 0-100, or -1 if no MongoDB record exists
    private double reputationScore;   // 0-100 peer rating, for ES index / tiebreak

    private boolean foundViaAdjacency; // true if this candidate came from a related-skill
    // search rather than an exact skill match
}
