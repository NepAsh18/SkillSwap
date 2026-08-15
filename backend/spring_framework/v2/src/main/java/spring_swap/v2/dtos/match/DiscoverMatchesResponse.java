package spring_swap.v2.dtos.match;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscoverMatchesResponse {
    private List<MatchResultDto> topMatches;   // adjacencyStrength == 1.0 (exact skill match)
    private List<MatchResultDto> adjacent;     // adjacencyStrength < 1.0 (correlated skill match)
    private boolean coldStart;                 // true if seeker had no learnable-skill matches and we fell back to popularity
}