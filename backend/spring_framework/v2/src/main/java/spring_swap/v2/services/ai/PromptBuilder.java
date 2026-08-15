package spring_swap.v2.services.ai;

import org.springframework.stereotype.Component;
import spring_swap.v2.document.ai.AssessmentQuestion;
import spring_swap.v2.dtos.ai.UserAnswerDto;
import spring_swap.v2.dtos.auth.ProfileResponse;
import spring_swap.v2.dtos.auth.EducationResponse;
import spring_swap.v2.dtos.auth.ProjectResponse;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// ai/PromptBuilder.java
@Component
public class PromptBuilder {

    private static final Map<Integer, String> LEVEL_DESC = Map.of(
            1, "Complete beginner. Knows basic syntax only.",
            2, "Knows fundamentals, can read and trace code.",
            3, "Intermediate. Writes working solutions.",
            4, "Advanced. Handles edge cases, design patterns.",
            5, "Expert. System design, deep internals, architecture."
    );

    private static final Map<Integer, int[]> QUESTION_MIX = Map.of(
            // {mcq, coding, aptitude}
            1, new int[]{4, 1, 2},
            2, new int[]{3, 2, 2},
            3, new int[]{3, 2, 2},
            4, new int[]{2, 3, 2},
            5, new int[]{1, 4, 2}
    );

    public String buildProfileAnalysisPrompt(ProfileResponse profile) {
        return """
            You are a technical assessment designer.
            Analyze this user's profile and determine their starting assessment level (1-5).

            User profile:
            - Name: %s
            - Skills proficient in: %s
            - Skills they want to learn: %s
            - Bio: %s
            - Education: %s
            - Projects: %s

            Level guide:
            1 = Complete beginner
            2 = Knows fundamentals
            3 = Intermediate practitioner
            4 = Advanced, handles complexity
            5 = Expert, system-level thinking

            Return JSON with: startingLevel (int 1-5), primarySkill (string),
            focusTopics (list of 3-4 specific topics to test), rationale (why this level).
            """.formatted(
                profile.getName(),
                profile.getSkillsProficient(),
                profile.getSkillsToLearn(),
                profile.getBio(),
                formatEducation(profile.getEducationList()),
                formatProjects(profile.getProjectList())
        );
    }

    public String buildQuestionGenerationPrompt(
            String skill, int level, List<String> topics, String sessionId) {
        int[] mix = QUESTION_MIX.get(level);
        int total = mix[0] + mix[1] + mix[2];

        return """
        You are an expert assessment designer and senior subject matter expert.
        Generate %d questions for this assessment:
        - Domain/Skill: %s
        - Level: %d/5 — %s
        - Topics to cover: %s
        - Mix: %d MCQ, %d practical/hands-on, %d aptitude/logic
        - Session ID: %s

        ROLE & ADAPTABILITY RULE:
        Tailor the tone and substance perfectly to the Domain (%s). 
        - If the domain is software/tech: "practical/hands-on" means code-focused tasks, and "aptitude" means system/algorithmic logic.
        - If the domain is non-technical (e.g., Music, Culinary, Business): "practical/hands-on" means real-world execution, troubleshooting workflows, or analysis. Do NOT force a non-technical user to write programming code.

        RULES:
        1. MCQ: Must have exactly 4 options labeled A, B, C, D. 'correctAnswer' = label token only (A, B, C, or D).
        2. PRACTICAL / HANDS-ON (300s limit): 
           - For tech skills at high levels (Levels 4-5), do NOT ask the user to write a massive algorithm from scratch (like a LeetCode Hard). Instead, present a code snippet with a bug to fix, an unoptimized function to rewrite cleanly, or a critical 5-10 line algorithm to complete. 
           - For non-tech skills, provide a complex real-world problem or scenario to analyze/troubleshoot; 'correctAnswer' = the precise step-by-step resolution strategy.
        3. APTITUDE / LOGIC: Worded problems testing situational judgment, technical diagnostics, or domain-specific mathematical/logical reasoning applied to %s.
        4. Difficulty MUST strictly match level %d. No trick questions. Real-world scenarios over trivia.
        5. explanation: Clear breakdown of why the solution is correct and why other approaches/options fail.
        6. time_limit_seconds: MCQ=60, practical=300, aptitude=120.

        EXPECTED SCHEMA / GUIDELINES:
        Provide an array of objects matching the structure below. Set 'options' to null if the question type is PRACTICAL and requires a free-form text or code solution.
        {
          "id": "q1", 
          "type": "MCQ", // Or "PRACTICAL", "APTITUDE"
          "topic": "core-principles",
          "level": %d, 
          "question": "The question text, code block, or situational prompt here.",
          "options": [
            {"label":"A","text":"Option A"},
            {"label":"B","text":"Option B"},
            {"label":"C","text":"Option C"},
            {"label":"D","text":"Option D"}
          ],
          "correctAnswer": "The precise correct answer string (either letter token or comprehensive written code/text solution)",
          "explanation": "Why it is correct and why other approaches fail.",
          "timeLimitSeconds": 60
        }

        Return a single valid JSON object containing exactly: sessionId, skill, level, and questions (an array of %d objects matching the instructions above).
        """.formatted(
                total, skill, level, LEVEL_DESC.get(level),
                String.join(", ", topics),
                mix[0], mix[1], mix[2],
                sessionId,
                skill, skill, level, level, total
        );
    }
    public String buildEvaluationPrompt(
            List<AssessmentQuestion> questions,
            List<UserAnswerDto> answers) {

        StringBuilder qa = new StringBuilder();
        for (AssessmentQuestion q : questions) {
            String userAns = answers.stream()
                    .filter(a -> a.getQuestionId().equals(q.getQuestionId()))
                    .map(UserAnswerDto::getAnswer)
                    .findFirst()
                    .orElse("NO ANSWER");

            qa.append("""
                Question %s [%s] — %s:
                  Q: %s
                  Correct: %s
                  User answered: %s
                ---
                """.formatted(
                    q.getQuestionId(), q.getType(), q.getTopic(),
                    q.getQuestionText(), q.getCorrectAnswer(), userAns
            ));
        }

        int maxScore = questions.size() * 10;

        return """
            You are a technical assessment evaluator. Evaluate these answers.

            %s

            Scoring:
            - MCQ: 10 if correct, 0 if wrong
            - Coding: 0–10 based on correctness and approach quality
            - Aptitude: 10 correct, 5 partially correct, 0 wrong
            - totalScore = (sum of scores / %d) * 100, rounded to int
            - passed = true if totalScore >= 70
            - nextLevel: passed AND level<5 → level+1; score<40 AND level>1 → level-1; else same

            Return JSON with: totalScore (0-100), passed (bool), nextLevel (1-5),
            overallFeedback (2-3 sentences on performance and what to study next),
            results (array with: questionId, correct, score 0-10, userAnswer,
            correctAnswer, feedback per question).
            """.formatted(qa.toString(), maxScore);
    }

    private String formatEducation(List<EducationResponse> list) {
        if (list == null || list.isEmpty()) return "None listed";
        return list.stream()
                .map(e -> e.getDegree() + " at " + e.getInstitution())
                .collect(Collectors.joining(", "));
    }

    private String formatProjects(List<ProjectResponse> list) {
        if (list == null || list.isEmpty()) return "None listed";
        return list.stream()
                .map(p -> p.getTitle() + " (" + p.getTechStack() + ")")
                .collect(Collectors.joining(", "));
    }
}