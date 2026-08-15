package spring_swap.v2.services.match;


import org.springframework.stereotype.Component;
import spring_swap.v2.domain.ScoringContext;

import java.util.*;

/**
 * Five independent lexical / keyword-based algorithms, each producing a
 * normalised score in [0, 1].  CompositeScorer then blends them with weights.

 * Adding a new algorithm = implement SkillScorer and add it to CompositeScorer.
 */

// ══════════════════════════════════════════════════════════════════════════════
//  Contract
// ══════════════════════════════════════════════════════════════════════════════

interface SkillScorer {
    String name();
    double score(ScoringContext ctx);
}

// ══════════════════════════════════════════════════════════════════════════════
//  Algorithm 1 — Token Match Ratio  (directional, 0-1)
//
//  "Of the N skills the seeker wants to learn, how many does the candidate
//   explicitly teach?"
//
//  Best for: primary sort — punishes candidates that only partially cover needs.
// ══════════════════════════════════════════════════════════════════════════════
@Component
class TokenMatchScorer implements SkillScorer {
    @Override public String name() { return "tokenMatch"; }

    @Override
    public double score(ScoringContext ctx) {
        if (ctx.seekerLearns().isEmpty()) return 0.0;
        long matches = ctx.seekerLearns().stream()
                .filter(ctx.candidateTeaches()::contains)
                .count();
        return (double) matches / ctx.seekerLearns().size();
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  Algorithm 2 — Jaccard Similarity  (symmetric, 0-1)
//
//  Jaccard(A,B) = |A ∩ B| / |A ∪ B|
//  Applied to (seekerLearns, candidateTeaches).
//
//  Best for: ranking among candidates with same token-match count; rewards
//  candidates whose teaching set closely mirrors what the seeker wants
//  without unrelated skills inflating the score.
// ══════════════════════════════════════════════════════════════════════════════
@Component
class JaccardSkillScorer implements SkillScorer {
    @Override public String name() { return "jaccard"; }

    @Override
    public double score(ScoringContext ctx) {
        Set<String> intersection = new HashSet<>(ctx.seekerLearns());
        intersection.retainAll(ctx.candidateTeaches());

        Set<String> union = new HashSet<>(ctx.seekerLearns());
        union.addAll(ctx.candidateTeaches());

        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  Algorithm 3 — Badge Tier Score  (0-1)
//
//  Converts the candidate's highest badge tier (from BadgeService in PostgreSQL)
//  into a continuous score.  The tiers are ordinal so we map them to discrete
//  floats with a slight progression curve rather than linear spacing.
//
//  Also blends the candidate's badgeAvgScore (0-100) for fine-grained ranking
//  within the same tier.
//
//  Best for: trust / reputation signal — ensures a MASTER-tier candidate
//  outranks a NOVICE even if raw skill overlap is similar.
// ══════════════════════════════════════════════════════════════════════════════
@Component
class BadgeTierScorer implements SkillScorer {
    @Override public String name() { return "badgeTier"; }

    private static final Map<String, Double> TIER_WEIGHTS = Map.of(
            "MASTER",       1.00,
            "EXPERT",       0.82,
            "PRACTITIONER", 0.62,
            "APPRENTICE",   0.40,
            "NOVICE",       0.18
    );

    @Override
    public double score(ScoringContext ctx) {
        double tierBase = TIER_WEIGHTS.getOrDefault(ctx.candidateTopBadgeTier(), 0.18);
        // blend 70% tier label, 30% raw average score
        double avgNorm = Math.max(0, Math.min(100, ctx.candidateBadgeAvgScore())) / 100.0;
        return (tierBase * 0.70) + (avgNorm * 0.30);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  Algorithm 4 — AI Assessment Score  (0-1)
//
//  Pulls the candidate's average score from MongoDB ai_assessments for the
//  specific skills the seeker wants to learn.  -1 means no record exists
//  (new user or unassessed skill) → neutral score of 0.5 to avoid penalising
//  candidates for a data gap.
//
//  Best for: differentiating within the same badge tier; a Practitioner who
//  consistently scores 85 beats one who averages 62.
// ══════════════════════════════════════════════════════════════════════════════
@Component
class AssessmentScorer implements SkillScorer {
    @Override public String name() { return "aiAssessment"; }

    @Override
    public double score(ScoringContext ctx) {
        if (ctx.candidateAssessmentAvg() < 0) return 0.50; // no data → neutral
        return Math.max(0, Math.min(100, ctx.candidateAssessmentAvg())) / 100.0;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  Algorithm 5 — Mutual Benefit Score  (0-1)
//
//  Does the candidate also want to learn something the seeker can teach?
//  Jaccard of (candidateLearns ∩ seekerTeaches).
//
//  Rewards pairs that can have a genuine skill-exchange (not just one-way
//  mentorship), creating more durable connections on the platform.
//
//  Weight kept low (0.05) so it's a tiebreaker, not a primary driver.
// ══════════════════════════════════════════════════════════════════════════════
@Component
class MutualBenefitScorer implements SkillScorer {
    @Override public String name() { return "mutualBenefit"; }

    @Override
    public double score(ScoringContext ctx) {
        if (ctx.seekerTeaches().isEmpty() || ctx.candidateLearns().isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(ctx.candidateLearns());
        intersection.retainAll(ctx.seekerTeaches());

        Set<String> union = new HashSet<>(ctx.candidateLearns());
        union.addAll(ctx.seekerTeaches());

        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  CompositeScorer — wires and weights the five algorithms
// ══════════════════════════════════════════════════════════════════════════════

@Component
class CompositeScorer {

    private final TokenMatchScorer   tokenMatch;
    private final JaccardSkillScorer jaccard;
    private final BadgeTierScorer    badge;
    private final AssessmentScorer   assessment;
    private final MutualBenefitScorer mutualBenefit;

    // ── Weights (must sum to 1.0) ────────────────────────────────────────────
    // Tweak these based on A/B test feedback from real users.
    private static final double W_TOKEN      = 0.35;
    private static final double W_JACCARD    = 0.25;
    private static final double W_BADGE      = 0.20;
    private static final double W_ASSESSMENT = 0.15;
    private static final double W_MUTUAL     = 0.05;

    // Floor applied to the adjacency discount multiplier. Even a candidate
    // found via a weakly-correlated adjacent skill (NPMI near 0) still gets
    // at least this fraction of their raw composite score, rather than being
    // discounted to near-zero — they still surfaced for a reason, just a
    // weaker one than an exact match.
    private static final double ADJACENCY_DISCOUNT_FLOOR = 0.5;

    public CompositeScorer(TokenMatchScorer tokenMatch, JaccardSkillScorer jaccard,
                           BadgeTierScorer badge, AssessmentScorer assessment,
                           MutualBenefitScorer mutualBenefit) {
        this.tokenMatch    = tokenMatch;
        this.jaccard       = jaccard;
        this.badge         = badge;
        this.assessment    = assessment;
        this.mutualBenefit = mutualBenefit;
    }

    /**
     * Returns a map of scoreName → rawScore for transparency/explainability,
     * plus the composite "final" entry.
     */
    public Map<String, Double> scoreAll(ScoringContext ctx) {
        double t = tokenMatch.score(ctx);
        double j = jaccard.score(ctx);
        double b = badge.score(ctx);
        double a = assessment.score(ctx);
        double m = mutualBenefit.score(ctx);

        // Graduated adjacency discount: 1.0 for an exact skill match,
        // otherwise scaled between ADJACENCY_DISCOUNT_FLOOR and 1.0 based on
        // how strong the co-occurrence (NPMI) is between the seeker's desired
        // skill and the skill the candidate actually teaches. A candidate
        // surfaced via a highly-correlated adjacent skill is barely
        // discounted; one surfaced via a weak correlation is discounted more,
        // but never below the floor.
        double strength = Math.max(0.0, Math.min(1.0, ctx.adjacencyStrength()));
        double adjacencyDiscount = ADJACENCY_DISCOUNT_FLOOR
                + (1.0 - ADJACENCY_DISCOUNT_FLOOR) * strength;

        double composite = (t * W_TOKEN + j * W_JACCARD + b * W_BADGE + a * W_ASSESSMENT + m * W_MUTUAL)
                * adjacencyDiscount;

        return Map.of(
                tokenMatch.name(),    t,
                jaccard.name(),       j,
                badge.name(),         b,
                assessment.name(),    a,
                mutualBenefit.name(), m,
                "final",              composite
        );
    }
}