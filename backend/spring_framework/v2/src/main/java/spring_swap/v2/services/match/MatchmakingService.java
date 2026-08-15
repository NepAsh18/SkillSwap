package spring_swap.v2.services.match;


import org.springframework.stereotype.Service;
import spring_swap.v2.document.ai.UserBadge;
import spring_swap.v2.domain.UserSearchDocument;
import spring_swap.v2.domain.ScoringContext;
import spring_swap.v2.dtos.match.DiscoverMatchesResponse;
import spring_swap.v2.dtos.match.MatchResultDto;
import spring_swap.v2.services.ai.AssessmentAIService;
import spring_swap.v2.services.ai.BadgeService;
import spring_swap.v2.services.auth.ProfileService;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;


@Service
public class MatchmakingService {

    private final UserSearchService userSearchService;
    private final ProfileService profileService;
    private final BadgeService badgeService;
    private final AssessmentAIService aiAssessmentService;
    private final CompositeScorer compositeScorer;
    private final SkillAdjacencyService skillAdjacencyService;

    private static final int ADJACENT_SKILLS_PER_TERM = 5;
    private static final int ADJACENCY_POOL_SIZE = 100;
    private static final int COLD_START_TOP_SKILLS = 10;
    private static final int COLD_START_POOL_SIZE = 100;

    public MatchmakingService(
            UserSearchService userSearchService,
            ProfileService profileService,
            BadgeService badgeService,
            AssessmentAIService aiAssessmentService,
            CompositeScorer compositeScorer,
            SkillAdjacencyService skillAdjacencyService
    ) {
        this.userSearchService = userSearchService;
        this.profileService = profileService;
        this.badgeService = badgeService;
        this.aiAssessmentService = aiAssessmentService;
        this.compositeScorer = compositeScorer;
        this.skillAdjacencyService = skillAdjacencyService;
    }


    public DiscoverMatchesResponse getTopMatches(UUID seekerId, int limit) {
        var seeker = profileService.getProfile(seekerId);
        Set<String> seekerTeaches = splitSkills(seeker.getSkillsProficient());
        Set<String> seekerLearns  = splitSkills(seeker.getSkillsToLearn());

        List<UserSearchDocument> exactPool = fetchExactPool(seekerLearns);

        Map<String, Double> adjacentSkillStrengths = buildAdjacentSkillMap(seekerLearns);
        List<UserSearchDocument> adjacencyPool = fetchAdjacencyPool(adjacentSkillStrengths);

        boolean coldStart = exactPool.isEmpty() && adjacencyPool.isEmpty();

        if (coldStart) {
            exactPool = fetchColdStartPool();
        }

        Map<String, UserSearchDocument> merged = new LinkedHashMap<>();
        for (UserSearchDocument doc : exactPool) merged.put(doc.getUserId(), doc);
        for (UserSearchDocument doc : adjacencyPool) merged.putIfAbsent(doc.getUserId(), doc);

        Set<String> exactMatchUserIds = exactPool.stream()
                .map(UserSearchDocument::getUserId)
                .collect(Collectors.toSet());

        List<MatchResultDto> scored = merged.values().stream()
                .filter(doc -> !doc.getUserId().equals(seekerId.toString()))
                .map(doc -> scoreCandidate(
                        seekerTeaches, seekerLearns, doc,
                        coldStart ? 1.0 : resolveAdjacencyStrength(doc, exactMatchUserIds, seekerLearns, adjacentSkillStrengths)))
                .sorted(Comparator.comparingDouble(MatchResultDto::getFinalScore).reversed())
                .toList();

        List<MatchResultDto> topMatches = scored.stream()
                .filter(m -> m.getAdjacencyStrength() >= 1.0)
                .limit(limit)
                .toList();

        List<MatchResultDto> adjacent = scored.stream()
                .filter(m -> m.getAdjacencyStrength() < 1.0)
                .limit(limit)
                .toList();

        return DiscoverMatchesResponse.builder()
                .topMatches(topMatches)
                .adjacent(adjacent)
                .coldStart(coldStart)
                .build();
    }

    private List<UserSearchDocument> fetchExactPool(Set<String> seekerLearns) {
        if (seekerLearns.isEmpty()) return List.of();
        try {
            return userSearchService.candidatesTeachingAnyOf(new ArrayList<>(seekerLearns), 200);
        } catch (IOException e) {
            throw new RuntimeException("Elasticsearch candidate pool query failed", e);
        }
    }

    private List<UserSearchDocument> fetchAdjacencyPool(Map<String, Double> adjacentSkillStrengths) {
        if (adjacentSkillStrengths.isEmpty()) return List.of();
        try {
            return userSearchService.candidatesTeachingAnyOf(
                    new ArrayList<>(adjacentSkillStrengths.keySet()), ADJACENCY_POOL_SIZE);
        } catch (IOException e) {
            return List.of();
        }
    }

    private List<UserSearchDocument> fetchColdStartPool() {
        List<String> popularSkills = skillAdjacencyService.getMostPopularSkills(COLD_START_TOP_SKILLS);
        if (popularSkills.isEmpty()) return List.of();
        try {
            return userSearchService.candidatesTeachingAnyOf(popularSkills, COLD_START_POOL_SIZE);
        } catch (IOException e) {
            return List.of();
        }
    }

    private Map<String, Double> buildAdjacentSkillMap(Set<String> seekerLearns) {
        Map<String, Double> combined = new HashMap<>();
        for (String skill : seekerLearns) {
            Map<String, Double> adjacent = skillAdjacencyService.getAdjacentSkills(skill, ADJACENT_SKILLS_PER_TERM);
            adjacent.forEach((adjSkill, strength) ->
                    combined.merge(adjSkill, strength, Math::max));
        }
        return combined;
    }

    private double resolveAdjacencyStrength(
            UserSearchDocument doc,
            Set<String> exactMatchUserIds,
            Set<String> seekerLearns,
            Map<String, Double> adjacentSkillStrengths
    ) {
        if (exactMatchUserIds.contains(doc.getUserId())) {
            boolean actuallyExact = doc.getSkillsProficient() != null &&
                    doc.getSkillsProficient().stream().anyMatch(seekerLearns::contains);
            if (actuallyExact) return 1.0;
        }

        if (doc.getSkillsProficient() == null) return 0.0;

        return doc.getSkillsProficient().stream()
                .map(adjacentSkillStrengths::get)
                .filter(Objects::nonNull)
                .max(Double::compareTo)
                .orElse(0.0);
    }

    private MatchResultDto scoreCandidate(
            Set<String> seekerTeaches,
            Set<String> seekerLearns,
            UserSearchDocument candidateDoc,
            double adjacencyStrength
    ) {
        UUID candidateId = UUID.fromString(candidateDoc.getUserId());

        List<UserBadge> badges = badgeService.getBadgesForUser(candidateId);
        String topTier = badges.stream()
                .max(Comparator.comparingDouble(b -> tierRank(b.getTier())))
                .map(UserBadge::getTier)
                .orElse("NOVICE");
        double badgeAvg = badges.stream()
                .mapToDouble(UserBadge::getAverageScore)
                .average()
                .orElse(0.0);

        double aiAvg = aiAssessmentService.getAverageScoreForSkills(candidateId, seekerLearns);

        ScoringContext ctx = new ScoringContext(
                seekerTeaches,
                seekerLearns,
                candidateDoc.getSkillsProficient(),
                candidateDoc.getSkillsToLearn(),
                topTier,
                badgeAvg,
                aiAvg,
                adjacencyStrength
        );

        Map<String, Double> breakdown = compositeScorer.scoreAll(ctx);

        return MatchResultDto.builder()
                .userId(candidateId)
                .username(candidateDoc.getUsername())
                .name(candidateDoc.getName())
                .picture(null)
                .bio(candidateDoc.getBio())
                .skillsProficient(candidateDoc.getSkillsProficient())
                .skillsToLearn(candidateDoc.getSkillsToLearn())
                .topBadgeTier(topTier)
                .finalScore(breakdown.get("final"))
                .breakdown(breakdown)
                .adjacencyStrength(adjacencyStrength)
                .build();
    }

    private double tierRank(String tier) {
        return switch (tier) {
            case "MASTER" -> 5;
            case "EXPERT" -> 4;
            case "PRACTITIONER" -> 3;
            case "APPRENTICE" -> 2;
            default -> 1;
        };
    }

    private Set<String> splitSkills(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }
}