package spring_swap.v2.services.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.ai.AssessmentQuestion;
import spring_swap.v2.document.ai.AssessmentSession;
import spring_swap.v2.document.ai.MCQOption;
import spring_swap.v2.document.ai.QuestionHarness;
import spring_swap.v2.dtos.ai.UserAnswerDto;
import spring_swap.v2.dtos.ai.output.EvaluationOutput;
import spring_swap.v2.dtos.ai.output.GeneratedQuestionSet;
import spring_swap.v2.dtos.ai.output.LevelAssessmentOutput;
import spring_swap.v2.dtos.ai.output.QuestionEvaluation;
import spring_swap.v2.dtos.auth.ProfileResponse;
import spring_swap.v2.repository.ai.AssessmentSessionRepository;
import spring_swap.v2.repository.ai.QuestionHarnessRepository;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

// service/AssessmentAIService.java
@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentAIService {

    private final ChatClient chatClient;
    private final PromptBuilder promptBuilder;
    private final QuestionHarnessRepository harnessRepo;
    private final AssessmentSessionRepository sessionRepo;

    // ── Phase 1: Analyze profile → determine starting level ──────
    public LevelAssessmentOutput analyzeProfile(ProfileResponse profile) {
        var converter = new BeanOutputConverter<>(LevelAssessmentOutput.class);

        String prompt = promptBuilder.buildProfileAnalysisPrompt(profile)
                + "\n\n" + converter.getFormat();

        String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        return converter.convert(response);
    }

    // ── Phase 2: Generate or fetch questions ─────────────────────
    public List<AssessmentQuestion> getOrGenerateQuestions(
            String skill, int level, List<String> topics, String sessionId) {

        // Check harness cache first — do we have enough questions?
        List<QuestionHarness> cached = harnessRepo.findBySkillAndLevelAndTopic(skill, level, topics);

        if (cached.size() >= 7) {
            log.info("Serving {} questions from harness cache for skill={} level={}",
                    cached.size(), skill, level);
            List<QuestionHarness> reranked = rerank(cached, level);
            List<QuestionHarness> selected = reranked.subList(0, Math.min(7, reranked.size()));
            updateHarnessServedStats(selected);
            return mapHarnessToQuestions(selected);
        }

        // Not enough cached — generate fresh from LLM
        log.info("Cache miss — generating questions via LLM for skill={} level={}", skill, level);
        GeneratedQuestionSet generated = generateFromLlm(skill, level, topics, sessionId);

        // Save each new question to harness for future reuse
        saveToHarness(generated, skill, level);

        return mapGeneratedToQuestions(generated);
    }

    // ── Phase 3: Evaluate answers ─────────────────────────────────
    public EvaluationOutput evaluateAnswers(
            List<AssessmentQuestion> questions,
            List<UserAnswerDto> answers) {

        var converter = new BeanOutputConverter<>(EvaluationOutput.class);

        String prompt = promptBuilder.buildEvaluationPrompt(questions, answers)
                + "\n\n" + converter.getFormat();

        String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        EvaluationOutput result = converter.convert(response);

        // Update harness difficulty scores based on actual user performance
        updateHarnessDifficultyScores(questions, result.results());

        return result;
    }

    // ── Reranking logic ───────────────────────────────────────────

    private List<QuestionHarness> rerank(List<QuestionHarness> pool, int level) {

        double target = 1.0 - (level / 5.0);

        List<QuestionHarness> ranked = pool.stream()
                .sorted(Comparator.comparingDouble(
                        q -> Math.abs(q.getDifficultyScore() - target)))
                .collect(Collectors.toList());

        int candidatePool = Math.min(20, ranked.size());

        List<QuestionHarness> candidates =
                new ArrayList<>(ranked.subList(0, candidatePool));

        Collections.shuffle(candidates);

        return candidates.subList(
                0,
                Math.min(7, candidates.size())
        );
    }

    // ── LLM generation ────────────────────────────────────────────
    private GeneratedQuestionSet generateFromLlm(
            String skill, int level, List<String> topics, String sessionId) {

        var converter = new BeanOutputConverter<>(GeneratedQuestionSet.class);

        String prompt = promptBuilder.buildQuestionGenerationPrompt(
                skill, level, topics, sessionId)
                + "\n\n" + converter.getFormat();

        // Retry loop — equivalent to instructor's max_retries in Python
        int maxRetries = 3;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                String response = chatClient.prompt()
                        .user(prompt)
                        .call()
                        .content();
                return converter.convert(response);
            } catch (Exception e) {
                log.warn("LLM generation attempt {}/{} failed: {}", attempt, maxRetries, e.getMessage());
                lastException = e;
                prompt += "\n\nPrevious attempt failed with: " + e.getMessage()
                        + ". Fix and return valid JSON only.";
            }
        }

        throw new RuntimeException("LLM generation failed after " + maxRetries
                + " attempts", lastException);
    }

    // ── Harness persistence ───────────────────────────────────────
    private void saveToHarness(GeneratedQuestionSet generated, String skill, int level) {
        List<QuestionHarness> toSave = generated.questions().stream()
                .map(q -> QuestionHarness.builder()
                        .skill(skill)
                        .topic(q.topic())
                        .level(level)
                        .type(q.type())
                        .questionText(q.question())
                        .options(q.options() == null ? null :
                                q.options().stream()
                                        .map(o -> new MCQOption(o.label(), o.text()))
                                        .collect(Collectors.toList()))
                        .correctAnswer(q.correctAnswer())
                        .explanation(q.explanation())
                        .timeLimitSeconds(q.timeLimitSeconds())
                        .timesServed(0)
                        .timesCorrect(0)
                        .difficultyScore(0.5)   // neutral start
                        .createdAt(Instant.now())
                        .lastServedAt(Instant.now())
                        .searchableText(skill + " " + q.topic() + " " + q.question())
                        .build())
                .collect(Collectors.toList());

        harnessRepo.saveAll(toSave);
        log.info("Saved {} new questions to harness", toSave.size());
    }

    private void updateHarnessServedStats(List<QuestionHarness> served) {
        served.forEach(q -> {
            q.setTimesServed(q.getTimesServed() + 1);
            q.setLastServedAt(Instant.now());
        });
        harnessRepo.saveAll(served);
    }

    private void updateHarnessDifficultyScores(
            List<AssessmentQuestion> questions,
            List<QuestionEvaluation> evaluations) {

        for (QuestionEvaluation eval : evaluations) {
            questions.stream()
                    .filter(q -> q.getQuestionId().equals(eval.questionId()))
                    .filter(q -> q.getHarnessId() != null)
                    .findFirst()
                    .ifPresent(q -> harnessRepo.findById(q.getHarnessId()).ifPresent(h -> {
                        h.setTimesServed(h.getTimesServed() + 1);
                        if (eval.correct()) h.setTimesCorrect(h.getTimesCorrect() + 1);
                        // Recalculate difficulty: what % got it right
                        h.setDifficultyScore(
                                h.getTimesServed() == 0 ? 0.5
                                        : (double) h.getTimesCorrect() / h.getTimesServed()
                        );
                        harnessRepo.save(h);
                    }));
        }
    }

    // ── Mappers ───────────────────────────────────────────────────
    private List<AssessmentQuestion> mapHarnessToQuestions(List<QuestionHarness> harness) {
        return harness.stream()
                .map(h -> AssessmentQuestion.builder()
                        .questionId("q" + (harness.indexOf(h) + 1))
                        .harnessId(h.getId())
                        .type(h.getType())
                        .topic(h.getTopic())
                        .level(h.getLevel())
                        .questionText(h.getQuestionText())
                        .options(h.getOptions())
                        .correctAnswer(h.getCorrectAnswer())
                        .explanation(h.getExplanation())
                        .timeLimitSeconds(h.getTimeLimitSeconds())
                        .build())
                .collect(Collectors.toList());
    }

    private List<AssessmentQuestion> mapGeneratedToQuestions(GeneratedQuestionSet gen) {
        return gen.questions().stream()
                .map(q -> AssessmentQuestion.builder()
                        .questionId(q.id())
                        .harnessId(null)   // will be set after harness save
                        .type(q.type())
                        .topic(q.topic())
                        .level(q.level())
                        .questionText(q.question())
                        .options(q.options() == null ? null :
                                q.options().stream()
                                        .map(o -> new MCQOption(o.label(), o.text()))
                                        .collect(Collectors.toList()))
                        .correctAnswer(q.correctAnswer())
                        .explanation(q.explanation())
                        .timeLimitSeconds(q.timeLimitSeconds())
                        .build())
                .collect(Collectors.toList());
    }
    public double getAverageScoreForSkills(UUID candidateId, Set<String> desiredSkills) {
        if (desiredSkills.isEmpty()) return -1;

        List<AssessmentSession> allSessions =
                sessionRepo.findByUserIdOrderByCreatedAtDesc(candidateId);

        List<Integer> relevantScores = allSessions.stream()
                .filter(s -> "COMPLETED".equalsIgnoreCase(s.getStatus()))
                .filter(s -> s.getSkill() != null
                        && desiredSkills.contains(s.getSkill().toLowerCase()))
                .filter(s -> s.getTotalScore() != null)
                .map(AssessmentSession::getTotalScore)
                .toList();

        if (relevantScores.isEmpty()) return -1;

        return relevantScores.stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(-1);
    }
}