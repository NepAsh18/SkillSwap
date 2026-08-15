package spring_swap.v2.config;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import spring_swap.v2.document.ai.UserBadge;
import spring_swap.v2.domain.UserSearchDocument;
import spring_swap.v2.models.auth.Education;
import spring_swap.v2.models.auth.Project;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.repo.auth.UserRepository;
import spring_swap.v2.services.ai.AssessmentAIService;
import spring_swap.v2.services.ai.BadgeService;
import spring_swap.v2.services.match.SkillAdjacencyService;
import spring_swap.v2.services.match.UserSearchService;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class SearchIndexBackfillRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final UserSearchService userSearchService;
    private final BadgeService badgeService;
    private final AssessmentAIService assessmentAIService;
    private final SkillAdjacencyService skillAdjacencyService;


    private static final double PROFICIENT_WEIGHT = 2.0;
    private static final double TO_LEARN_WEIGHT = 1.0;

    @Override
    public void run(String... args) {
        if (!"true".equalsIgnoreCase(System.getenv("BACKFILL_SEARCH_INDEX"))) {
            log.info("BACKFILL_SEARCH_INDEX not set to true — skipping search index backfill.");
            return;
        }

        log.info("=== Starting search index backfill ===");
        int count = 0;

        // Pull education-fetched users, then build a lookup for project lists
        List<User> usersWithEducation = userRepository.findAllWithEducation();
        Map<UUID, List<Project>> projectsByUserId = userRepository.findAllWithProjects().stream()
                .collect(Collectors.toMap(User::getId, User::getProjectList));

        // Guards the skill-stats/skill-pairs seed specifically — running it
        // twice would double-count every skill and pair, silently inflating
        // every NPMI score used for adjacency recommendations. The document
        // search-index sync (userSearchService.indexUser) is safe to rerun
        // regardless, since it's an upsert by userId.
        boolean shouldSeedAdjacency = !skillAdjacencyService.isAlreadyBackfilled();
        if (!shouldSeedAdjacency) {
            log.info("Skill adjacency graph already backfilled — skipping skill-stats/skill-pairs seed this run.");
        }

        for (User user : usersWithEducation) {
            try {
                // stitch in the projects fetched from the second query
                user.setProjectList(projectsByUserId.getOrDefault(user.getId(), List.of()));
                indexUser(user, shouldSeedAdjacency);
                count++;
            } catch (Exception e) {
                log.warn("Failed to index user={} during backfill: {}", user.getId(), e.getMessage());
            }
        }

        if (shouldSeedAdjacency) {
            skillAdjacencyService.markBackfillComplete();
            log.info("Skill adjacency graph backfill marked complete.");
        }

        log.info("=== Search index backfill complete. Indexed {} users. ===", count);
    }

    private void indexUser(User user, boolean seedAdjacency) {
        Set<String> proficientSkills = splitSkills(user.getSkillsProficient());
        Set<String> toLearnSkills = splitSkills(user.getSkillsToLearn());

        String topTier = resolveTopBadgeTier(user.getId());
        double assessmentScore = resolveWeightedAssessmentScore(user.getId(), proficientSkills, toLearnSkills);

        userSearchService.indexUser(UserSearchDocument.builder()
                .userId(user.getId().toString())
                .username(user.getUsername())
                .name(user.getName())
                .bio(user.getBio())
                .skillsProficient(proficientSkills)
                .skillsToLearn(toLearnSkills)
                .topBadgeTier(topTier)
                .reputationScore(0.0) // wire to actual reputation source when available
                .education(mapEducation(user))
                .projects(mapProjects(user))
                .skillAssessmentScore(assessmentScore)
                .build());

        // One-time seed of skill-stats/skill-pairs (co-occurrence graph) from
        // existing data. Guarded at the run() level so this never double-runs.
        if (seedAdjacency) {
            skillAdjacencyService.onProfileSkillsChanged(user.getId(), Set.of(), proficientSkills);
        }
    }

    // ── Badge tier ─────────────────────────────────────────────

    private String resolveTopBadgeTier(UUID userId) {
        List<UserBadge> badges = badgeService.getBadgesForUser(userId);
        return badges.stream()
                .max(Comparator.comparingDouble(b -> tierRank(b.getTier())))
                .map(UserBadge::getTier)
                .orElse("NOVICE");
    }

    private double tierRank(String tier) {
        return switch (tier) {
            case "MASTER" -> 5;
            case "EXPERT" -> 4;
            case "PRACTITIONER" -> 3;
            case "APPRENTICE" -> 2;
            default -> 1; // NOVICE
        };
    }

    // ── Assessment score, weighted proficient > to-learn ────────

    private double resolveWeightedAssessmentScore(
            UUID userId, Set<String> proficientSkills, Set<String> toLearnSkills) {

        double proficientAvg = proficientSkills.isEmpty()
                ? -1
                : assessmentAIService.getAverageScoreForSkills(userId, lower(proficientSkills));

        double toLearnAvg = toLearnSkills.isEmpty()
                ? -1
                : assessmentAIService.getAverageScoreForSkills(userId, lower(toLearnSkills));

        boolean hasProficient = proficientAvg >= 0;
        boolean hasToLearn = toLearnAvg >= 0;

        if (!hasProficient && !hasToLearn) return 0.0;
        if (hasProficient && !hasToLearn) return proficientAvg;
        if (!hasProficient) return toLearnAvg;

        return ((proficientAvg * PROFICIENT_WEIGHT) + (toLearnAvg * TO_LEARN_WEIGHT))
                / (PROFICIENT_WEIGHT + TO_LEARN_WEIGHT);
    }

    private Set<String> lower(Set<String> skills) {
        return skills.stream().map(String::toLowerCase).collect(Collectors.toSet());
    }

    // ── Education / projects ────────────────────────────────────

    private List<String> mapEducation(User user) {
        List<Education> list = user.getEducationList();
        if (list == null) return List.of();
        return list.stream()
                .map(this::formatEducation)
                .collect(Collectors.toList());
    }


    private String formatEducation(Education e) {
        // Adjust field getters below to match the actual Education model.
        StringBuilder sb = new StringBuilder();
        if (e.getDegree() != null) sb.append(e.getDegree());
        if (e.getInstitution() != null) sb.append(sb.length() > 0 ? " - " : "").append(e.getInstitution());
        return sb.toString();
    }


    private List<String> mapProjects(User user) {
        List<Project> list = user.getProjectList();
        if (list == null) return List.of();
        return list.stream()
                .map(this::formatProject)
                .collect(Collectors.toList());
    }

    private String formatProject(Project p) {
        // Adjust field getters below to match the actual Project model.
        StringBuilder sb = new StringBuilder();
        if (p.getTitle() != null) sb.append(p.getTitle());
        if (p.getDescription() != null) sb.append(sb.length() > 0 ? " - " : "").append(p.getDescription());
        return sb.toString();
    }

    // ── Skills parsing ───────────────────────────────────────────

    private Set<String> splitSkills(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}