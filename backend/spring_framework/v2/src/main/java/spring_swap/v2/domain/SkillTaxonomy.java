package spring_swap.v2.domain;



import java.util.*;
import java.util.stream.Collectors;

/**
 * Pure domain object — zero framework dependencies.
 *
 * Captures the "adjacent skills" relationship used by RecommendationService.
 * Given a skill the user wants to learn, this returns related skills so we can
 * surface teachers who don't teach the exact skill but teach something directly
 * neighbouring it (e.g. user wants "React" → also show Vue / Angular teachers).
 *
 * The map is bidirectional by construction: if React→JavaScript exists,
 * expand() walking the adjacency also finds JavaScript users.
 *
 * In production this could be persisted in PostgreSQL and managed via an admin
 * API; for now a static map is correct and fast (O(1) lookup).
 */
public final class SkillTaxonomy {

    private static final Map<String, List<String>> ADJACENCY;

    static {
        Map<String, List<String>> map = new HashMap<>();

        // Frontend
        map.put("react",       List.of("vue", "angular", "svelte", "nextjs", "javascript", "typescript"));
        map.put("vue",         List.of("react", "nuxtjs", "angular", "javascript", "typescript"));
        map.put("angular",     List.of("react", "vue", "typescript", "rxjs", "javascript"));
        map.put("nextjs",      List.of("react", "javascript", "typescript", "vercel"));
        map.put("svelte",      List.of("react", "vue", "javascript"));
        map.put("typescript",  List.of("javascript", "react", "angular", "nodejs"));
        map.put("javascript",  List.of("typescript", "react", "vue", "nodejs", "express"));

        // Backend
        map.put("java",        List.of("spring", "kotlin", "scala", "microservices", "maven", "gradle"));
        map.put("spring",      List.of("java", "springboot", "microservices", "hibernate", "jpa"));
        map.put("springboot",  List.of("spring", "java", "microservices", "rest api"));
        map.put("python",      List.of("django", "fastapi", "flask", "data science", "machine learning", "pandas"));
        map.put("django",      List.of("python", "fastapi", "flask", "postgresql", "rest api"));
        map.put("fastapi",     List.of("python", "django", "rest api", "asyncio"));
        map.put("nodejs",      List.of("javascript", "express", "nestjs", "typescript", "mongodb"));
        map.put("express",     List.of("nodejs", "javascript", "rest api"));
        map.put("nestjs",      List.of("nodejs", "typescript", "microservices", "graphql"));
        map.put("golang",      List.of("microservices", "kubernetes", "docker", "grpc"));
        map.put("kotlin",      List.of("java", "android", "spring", "ktor"));
        map.put("rust",        List.of("systems programming", "webassembly", "golang", "c++"));

        // Data & ML
        map.put("machine learning", List.of("python", "tensorflow", "pytorch", "data science", "scikit-learn", "deep learning"));
        map.put("deep learning",    List.of("machine learning", "tensorflow", "pytorch", "neural networks", "python"));
        map.put("data science",     List.of("python", "machine learning", "pandas", "sql", "statistics", "r"));
        map.put("tensorflow",       List.of("machine learning", "python", "keras", "deep learning"));
        map.put("pytorch",          List.of("machine learning", "python", "deep learning", "tensorflow"));
        map.put("llm",              List.of("machine learning", "python", "nlp", "transformers", "openai"));
        map.put("nlp",              List.of("python", "machine learning", "llm", "transformers", "spacy"));

        // Database
        map.put("postgresql",  List.of("sql", "mysql", "database design", "java", "python"));
        map.put("mysql",       List.of("sql", "postgresql", "database design"));
        map.put("mongodb",     List.of("nosql", "nodejs", "python", "database design"));
        map.put("redis",       List.of("caching", "nosql", "nodejs", "java"));
        map.put("sql",         List.of("postgresql", "mysql", "database design", "data science"));
        map.put("elasticsearch", List.of("search", "nosql", "java", "log analysis"));

        // DevOps & Cloud
        map.put("docker",      List.of("kubernetes", "devops", "microservices", "golang", "ci/cd"));
        map.put("kubernetes",  List.of("docker", "devops", "microservices", "cloud", "helm"));
        map.put("aws",         List.of("cloud", "devops", "kubernetes", "terraform", "azure"));
        map.put("devops",      List.of("docker", "kubernetes", "ci/cd", "aws", "linux"));
        map.put("ci/cd",       List.of("devops", "github actions", "jenkins", "docker"));

        // Mobile
        map.put("android",     List.of("kotlin", "java", "flutter", "mobile development"));
        map.put("ios",         List.of("swift", "objective-c", "flutter", "mobile development"));
        map.put("flutter",     List.of("dart", "android", "ios", "mobile development"));
        map.put("react native",List.of("react", "javascript", "mobile development", "typescript"));
        map.put("swift",       List.of("ios", "objective-c", "xcode", "mobile development"));

        // DSA / Fundamentals
        map.put("algorithms",  List.of("data structures", "competitive programming", "leetcode", "computer science"));
        map.put("data structures", List.of("algorithms", "computer science", "java", "python", "c++"));
        map.put("system design",   List.of("microservices", "distributed systems", "architecture", "devops"));

        ADJACENCY = Collections.unmodifiableMap(map);
    }

    private SkillTaxonomy() {}

    /**
     * Returns adjacent skills for a single skill token (lowercase, trimmed).
     * Returns empty list if no adjacency defined — not an error.
     */
    public static List<String> adjacentTo(String skill) {
        return ADJACENCY.getOrDefault(normalise(skill), List.of());
    }

    /**
     * For a set of skills a user wants to learn, returns all neighbouring
     * skills (one hop) minus the original set — these are "adjacent recommendations".
     * Scored separately from direct matches.
     */
    public static Set<String> expandSkills(Set<String> skills) {
        Set<String> normalised = skills.stream().map(SkillTaxonomy::normalise).collect(Collectors.toSet());
        Set<String> expanded = new HashSet<>();
        for (String skill : normalised) {
            expanded.addAll(ADJACENCY.getOrDefault(skill, List.of()));
        }
        expanded.removeAll(normalised); // don't recommend skills the user already listed
        return expanded;
    }

    /**
     * Relevance discount for an adjacent-skill match.
     * Direct exact match = 1.0; adjacent = adjacency_weight.
     * Could be made skill-pair-specific; flat 0.65 is a safe default.
     */
    public static double adjacencyWeight() {
        return 0.65;
    }

    public static String normalise(String skill) {
        return skill == null ? "" : skill.toLowerCase(java.util.Locale.ROOT).strip();
    }

    /** Parse a comma-separated skill string into a normalised token set. */
    public static Set<String> parseSkills(String raw) {
        if (raw == null || raw.isBlank()) return Set.of();
        return Arrays.stream(raw.split("[,;|]+"))
                .map(SkillTaxonomy::normalise)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}