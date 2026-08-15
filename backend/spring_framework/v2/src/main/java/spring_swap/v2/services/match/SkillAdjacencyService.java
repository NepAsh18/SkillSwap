package spring_swap.v2.services.match;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.Script;
import co.elastic.clients.elasticsearch._types.ScriptLanguage;
import co.elastic.clients.json.JsonData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import spring_swap.v2.domain.SkillPairDocument;
import spring_swap.v2.domain.SkillStatsDocument;
import spring_swap.v2.repo.auth.UserRepository;
import spring_swap.v2.repositories.SkillPairRepository;
import spring_swap.v2.repositories.SkillStatsRepository;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Maintains skill co-occurrence data incrementally as user profiles change,
 * and answers "what skills are adjacent to X?" queries using NPMI
 * (Normalized Pointwise Mutual Information).
 *
 * NPMI(A,B) = PMI(A,B) / -log(P(A,B))
 * PMI(A,B)  = log( P(A,B) / (P(A) * P(B)) )
 *
 * This down-weights pairs that co-occur only because both skills are
 * individually very common (e.g. "JavaScript" would otherwise look
 * "adjacent" to almost everything).
 *
 * NPMI ranges [-1, 1]; scores are clamped to [0, 1] for use as a match
 * scoring multiplier — negative/independent associations are not useful
 * as recommendations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SkillAdjacencyService {

    private final ElasticsearchClient client;
    private final SkillStatsRepository skillStatsRepository;
    private final SkillPairRepository skillPairRepository;
    private final UserRepository userRepository;

    private static final String SKILL_STATS_INDEX = "skill-stats";
    private static final String SKILL_PAIRS_INDEX = "skill-pairs";

    // Reserved key for the one-time backfill marker doc, stored inside the
    // skill-stats index itself. Can't collide with a real skill name since
    // real keys are always normalize()'d (trimmed, lowercased) user input.
    private static final String BACKFILL_MARKER_KEY = "__adjacency_backfill_marker__";

    // ── One-time bulk-seed guard ─────────────────────────────────

    /**
     * True if the co-occurrence graph has already been bulk-seeded from
     * existing users (e.g. via SearchIndexBackfillRunner). Prevents a second
     * run from double-counting every skill and pair, which would silently
     * inflate every NPMI score.
     */
    public boolean isAlreadyBackfilled() {
        return skillStatsRepository.findById(BACKFILL_MARKER_KEY).isPresent();
    }

    /**
     * Marks the co-occurrence graph as bulk-seeded. Call this once, after a
     * full backfill loop completes successfully — not before, and not per-user,
     * so a run that fails partway through doesn't falsely look "done" and
     * block a retry.
     */
    public void markBackfillComplete() {
        skillStatsRepository.save(SkillStatsDocument.builder()
                .skillKey(BACKFILL_MARKER_KEY)
                .userCount(0)
                .build());
    }

    // ── Incremental update on profile save ──────────────────────

    /**
     * Call this whenever a user's skillsProficient set changes (including on
     * first creation, where oldSkills should be an empty set).
     * Diffs old vs new so removed skills are decremented, not just left stale.
     */
    public void onProfileSkillsChanged(UUID userId, Set<String> oldSkillsRaw, Set<String> newSkillsRaw) {
        Set<String> oldSkills = normalize(oldSkillsRaw);
        Set<String> newSkills = normalize(newSkillsRaw);

        if (oldSkills.equals(newSkills)) {
            return; // no change, skip all ES writes
        }

        Set<String> removed = new HashSet<>(oldSkills);
        removed.removeAll(newSkills);

        Set<String> added = new HashSet<>(newSkills);
        added.removeAll(oldSkills);

        try {
            // Per-skill counts: decrement removed, increment added
            for (String skill : removed) adjustSkillCount(skill, -1);
            for (String skill : added) adjustSkillCount(skill, +1);

            // Pair counts: decrement pairs no longer both present,
            // increment pairs now both present.
            adjustPairsForRemoval(oldSkills, removed);
            adjustPairsForAddition(newSkills, added);

        } catch (IOException e) {
            // Adjacency data is a "nice to have" signal, not core correctness —
            // log and continue rather than failing the profile save.
            log.warn("Failed to update skill adjacency data for user={}: {}", userId, e.getMessage());
        }
    }

    private void adjustPairsForRemoval(Set<String> oldSkills, Set<String> removed) throws IOException {
        for (String r : removed) {
            for (String other : oldSkills) {
                if (other.equals(r)) continue;
                adjustPairCount(r, other, -1);
            }
        }
    }

    private void adjustPairsForAddition(Set<String> newSkills, Set<String> added) throws IOException {
        for (String a : added) {
            for (String other : newSkills) {
                if (other.equals(a)) continue;
                adjustPairCount(a, other, +1);
            }
        }
    }

    private void adjustSkillCount(String skill, long delta) throws IOException {
        // Scripted upsert: atomic read-modify-write on the ES side, safe
        // under concurrent updates from different users touching the
        // same skill simultaneously.
        client.update(u -> u
                        .index(SKILL_STATS_INDEX)
                        .id(skill)
                        .script(scriptDeltaWithFloor("userCount", delta))
                        .upsert(SkillStatsDocument.builder()
                                .skillKey(skill)
                                .userCount(Math.max(0, delta))
                                .build()),
                SkillStatsDocument.class
        );
    }

    private void adjustPairCount(String skillA, String skillB, long delta) throws IOException {
        String[] sorted = sortPair(skillA, skillB);
        String id = sorted[0] + "::" + sorted[1];

        client.update(u -> u
                        .index(SKILL_PAIRS_INDEX)
                        .id(id)
                        .script(scriptDeltaWithFloor("pairCount", delta))
                        .upsert(SkillPairDocument.builder()
                                .id(id)
                                .skillA(sorted[0])
                                .skillB(sorted[1])
                                .pairCount(Math.max(0, delta))
                                .build()),
                SkillPairDocument.class
        );
    }

    private Script scriptDeltaWithFloor(String field, long delta) {
        // Floors at 0 so decrements on a doc that doesn't exist yet (or is
        // already at 0 due to out-of-order updates) never go negative.
        return Script.of(s -> s
                .source("long current = ctx._source." + field + "; "
                        + "long next = current + params.delta; "
                        + "ctx._source." + field + " = next < 0 ? 0 : next;")
                .lang(ScriptLanguage.Painless)
                .params("delta", JsonData.of(delta))
        );
    }

    // ── Cold start: platform-wide popular skills ────────────────

    /**
     * Returns the topN most commonly-taught skills platform-wide, ranked by
     * how many users list them in skillsProficient. Used as a cold-start
     * fallback when a seeker has no learnable-skill matches at all (empty
     * skillsToLearn, or nobody teaches it and nothing is adjacent either) —
     * surfaces generally strong candidates instead of an empty page.
     */
    public List<String> getMostPopularSkills(int topN) {
        try {
            return skillStatsRepository
                    .findByUserCountGreaterThanOrderByUserCountDesc(0, org.springframework.data.domain.PageRequest.of(0, topN))
                    .stream()
                    .map(SkillStatsDocument::getSkillKey)
                    .toList();
        } catch (Exception e) {
            log.warn("Failed to fetch popular skills for cold start: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Adjacency lookup at match time ──────────────────────────

    /**
     * Returns up to topN skills adjacent to the given skill, each mapped to
     * an NPMI-derived strength in [0, 1]. Skills with non-positive
     * association (independent or negatively correlated) are excluded.
     */
    public Map<String, Double> getAdjacentSkills(String skill, int topN) {
        String normalized = normalize(skill);

        List<SkillPairDocument> pairs;
        try {
            List<SkillPairDocument> asA = skillPairRepository.findBySkillA(normalized);
            List<SkillPairDocument> asB = skillPairRepository.findBySkillB(normalized);
            pairs = new ArrayList<>(asA.size() + asB.size());
            pairs.addAll(asA);
            pairs.addAll(asB);
        } catch (Exception e) {
            log.warn("Failed to fetch skill pairs for '{}': {}", normalized, e.getMessage());
            return Map.of();
        }

        if (pairs.isEmpty()) return Map.of();

        long totalUsers = getTotalUserCount();
        if (totalUsers <= 1) return Map.of(); // not enough data for meaningful probabilities

        Long skillCount = fetchSkillCount(normalized);
        if (skillCount == null || skillCount <= 0) return Map.of();

        Map<String, Double> result = new HashMap<>();

        for (SkillPairDocument pair : pairs) {
            String other = pair.getSkillA().equals(normalized) ? pair.getSkillB() : pair.getSkillA();
            Long otherCount = fetchSkillCount(other);
            if (otherCount == null || otherCount <= 0 || pair.getPairCount() <= 0) continue;

            double npmi = computeNpmi(skillCount, otherCount, pair.getPairCount(), totalUsers);
            if (npmi > 0) {
                result.put(other, npmi);
            }
        }

        return result.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(topN)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue,
                        (a, b) -> a, LinkedHashMap::new));
    }

    private double computeNpmi(long countA, long countB, long pairCount, long totalUsers) {
        double pA = (double) countA / totalUsers;
        double pB = (double) countB / totalUsers;
        double pAB = (double) pairCount / totalUsers;

        if (pAB <= 0) return 0.0;

        double pmi = Math.log(pAB / (pA * pB));
        double npmi = pmi / -Math.log(pAB);

        // Clamp to [0,1] — negative associations aren't useful recommendations.
        return Math.max(0.0, Math.min(1.0, npmi));
    }

    private Long fetchSkillCount(String skill) {
        return skillStatsRepository.findById(skill)
                .map(SkillStatsDocument::getUserCount)
                .orElse(null);
    }

    /**
     * NPMI'''s probabilities are P(skill) = usersWithSkill / totalUsers.
     * totalUsers here MUST mean total users in the system (userRepository.count()),
     * NOT the number of documents in skill-stats -- that would count distinct
     * SKILLS, a much smaller number, and would badly inflate every probability.
     */
    private long getTotalUserCount() {
        return userRepository.count();
    }

    // ── Helpers ──────────────────────────────────────────────────

    private String[] sortPair(String a, String b) {
        return a.compareTo(b) <= 0 ? new String[]{a, b} : new String[]{b, a};
    }

    private Set<String> normalize(Set<String> skills) {
        if (skills == null) return Set.of();
        return skills.stream()
                .filter(Objects::nonNull)
                .map(this::normalize)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    private String normalize(String skill) {
        return skill == null ? "" : skill.trim().toLowerCase();
    }
}