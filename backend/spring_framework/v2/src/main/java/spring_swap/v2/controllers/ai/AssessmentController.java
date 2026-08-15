package spring_swap.v2.controllers.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import spring_swap.v2.document.ai.AssessmentQuestion;
import spring_swap.v2.document.ai.AssessmentSession;
import spring_swap.v2.document.ai.UserAnswer;
import spring_swap.v2.document.ai.UserBadge;
import spring_swap.v2.dtos.ai.*;
import spring_swap.v2.dtos.ai.output.EvaluationOutput;
import spring_swap.v2.dtos.ai.output.LevelAssessmentOutput;
import spring_swap.v2.dtos.auth.ProfileResponse;
import spring_swap.v2.models.auth.User;
import spring_swap.v2.repository.ai.AssessmentSessionRepository;
import spring_swap.v2.services.ai.AssessmentAIService;
import spring_swap.v2.services.ai.BadgeService;
import spring_swap.v2.services.auth.ProfileService;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/v1/ai/assessment")
@RequiredArgsConstructor
@Slf4j
public class AssessmentController {

    private final AssessmentAIService aiService;
    private final BadgeService badgeService;
    private final AssessmentSessionRepository sessionRepo;
    private final ProfileService profileService;   // your existing service

    // GET — initiates the assessment from profile data
    @GetMapping("/initiate/{userId}")
    public ResponseEntity<AssessmentInitiateResponse> initiate(
            @PathVariable UUID userId) {

        // Fetch full profile from your existing ProfileService
        ProfileResponse profile = profileService.getProfile(userId);

        // Phase 1: analyze profile → starting level + topics
        LevelAssessmentOutput levelOutput = aiService.analyzeProfile(profile);

        // Create session in MongoDB
        AssessmentSession session = AssessmentSession.builder()
                .userId(userId)
                .skill(levelOutput.primarySkill())
                .level(levelOutput.startingLevel())
                .status("IN_PROGRESS")
                .createdAt(Instant.now())
                .build();
        session = sessionRepo.save(session);   // save early to get the ID

        // Phase 2: get or generate questions
        List<AssessmentQuestion> questions = aiService.getOrGenerateQuestions(
                levelOutput.primarySkill(),
                levelOutput.startingLevel(),
                levelOutput.focusTopics(),
                session.getId()
        );

        session.setQuestions(questions);
        sessionRepo.save(session);

        // Map to response DTO — strip correct answers
        List<QuestionDto> questionDtos = questions.stream()
                .map(q -> QuestionDto.builder()
                        .questionId(q.getQuestionId())
                        .type(q.getType())
                        .topic(q.getTopic())
                        .level(q.getLevel())
                        .questionText(q.getQuestionText())
                        .options(q.getOptions() == null ? null :
                                q.getOptions().stream()
                                        .map(o -> new MCQOptionDto(o.getLabel(), o.getText()))
                                        .collect(Collectors.toList()))
                        .timeLimitSeconds(q.getTimeLimitSeconds())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(AssessmentInitiateResponse.builder()
                .sessionId(session.getId())
                .skill(session.getSkill())
                .level(session.getLevel())
                .totalQuestions(questions.size())
                .questions(questionDtos)
                .build());
    }

    // POST — submit answers, evaluate, update badge
    @PostMapping("/submit/{sessionId}")
    public ResponseEntity<AssessmentResultResponse> submit(
            @PathVariable String sessionId,
            @RequestBody AnswerSubmitRequest request) {

        AssessmentSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        // Phase 3: evaluate answers
        EvaluationOutput evaluation = aiService.evaluateAnswers(
                session.getQuestions(),
                request.getAnswers()
        );

        // Persist evaluation results into session
        List<AssessmentQuestion> updatedQuestions = session.getQuestions().stream()
                .map(q -> {
                    evaluation.results().stream()
                            .filter(r -> r.questionId().equals(q.getQuestionId()))
                            .findFirst()
                            .ifPresent(r -> {
                                q.setCorrect(r.correct());
                                q.setScore(r.score());
                                q.setUserAnswer(r.userAnswer());
                                q.setFeedback(r.feedback());
                            });
                    return q;
                })
                .collect(Collectors.toList());

        session.setQuestions(updatedQuestions);
        session.setUserAnswers(request.getAnswers().stream()
                .map(a -> {
                    UserAnswer ua = new UserAnswer();
                    ua.setQuestionId(a.getQuestionId());
                    ua.setAnswer(a.getAnswer());
                    return ua;
                }).collect(Collectors.toList()));
        session.setTotalScore(evaluation.totalScore());
        session.setPassed(evaluation.passed());
        session.setNextLevel(evaluation.nextLevel());
        session.setOverallFeedback(evaluation.overallFeedback());
        session.setStatus("COMPLETED");
        session.setCompletedAt(Instant.now());
        sessionRepo.save(session);

        // Update badge
        UserBadge updatedBadge = badgeService.updateBadgeAfterSession(
                session.getUserId(),
                session.getSkill(),
                evaluation.totalScore(),
                evaluation.passed(),
                evaluation.nextLevel(),
                sessionId
        );

        // Build response
        List<QuestionResultDto> resultDtos = evaluation.results().stream()
                .map(r -> QuestionResultDto.builder()
                        .questionId(r.questionId())
                        .correct(r.correct())
                        .score(r.score())
                        .userAnswer(r.userAnswer())
                        .correctAnswer(r.correctAnswer())
                        .feedback(r.feedback())
                        .build())
                .collect(Collectors.toList());

        BadgeDto badgeDto = BadgeDto.builder()
                .skill(updatedBadge.getSkill())
                .tier(updatedBadge.getTier())
                .currentLevel(updatedBadge.getCurrentLevel())
                .averageScore(updatedBadge.getAverageScore())
                .sessionsCompleted(updatedBadge.getSessionsCompleted())
                .updatedAt(updatedBadge.getUpdatedAt())
                .build();

        return ResponseEntity.ok(AssessmentResultResponse.builder()
                .sessionId(sessionId)
                .skill(session.getSkill())
                .level(session.getLevel())
                .totalScore(evaluation.totalScore())
                .passed(evaluation.passed())
                .nextLevel(evaluation.nextLevel())
                .overallFeedback(evaluation.overallFeedback())
                .results(resultDtos)
                .badge(badgeDto)
                .build());
    }
}