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
            1, "Complete beginner. Knows only the basic building blocks/vocabulary of the skill, has not yet produced real, independent work.",
            2, "Knows the fundamentals. Can follow, reproduce, or explain standard techniques correctly, but still leans on guidance or references for anything unfamiliar.",
            3, "Intermediate practitioner. Independently produces working results for typical, real-world tasks in this skill without needing step-by-step guidance.",
            4, "Advanced. Handles unusual or difficult cases well, understands the underlying principles well enough to adapt technique deliberately, not just by habit.",
            5, "Expert. Thinks at the level of overall design/strategy in this skill, understands deep underlying mechanics, and can diagnose or improve upon suboptimal approaches others might take."
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
            You are a technical assessment designer. Your job is to determine this
            user's starting assessment level (1-5) and the exact topics to test.

            WEIGHTING RULE (critical — follow strictly):
            Base your analysis on "Skills proficient in" as the PRIMARY signal —
            it should drive roughly 80%% of your reasoning for both the level and
            the focus topics. Treat "Skills they want to learn" as light secondary
            context only (~20%% weight) — useful only to flag one possible stretch
            topic if directly relevant, never to pull the level up or down on its
            own, and never to introduce topics unrelated to what the user actually
            claims proficiency in. Do NOT average the two lists together. Do NOT
            let an ambitious "want to learn" entry (e.g. a much harder or unrelated
            skill) inflate the level — proficiency claims are what's being verified;
            aspirations are not.

            User profile:
            - Name: %s
            - Skills proficient in (PRIMARY — assess depth in these): %s
            - Skills they want to learn (SECONDARY — context only): %s
            - Bio: %s
            - Education: %s
            - Projects: %s

            Level guide (apply to the proficient skills specifically, not the
            person's general experience level — these must read correctly for
            ANY domain, technical or not, e.g. "React" as much as "Guitar" or
            "Cooking"):
            1 = Complete beginner — knows only the basic building blocks/vocabulary, no independent real work produced yet
            2 = Knows fundamentals — can follow or reproduce standard technique correctly, still leans on guidance for anything unfamiliar
            3 = Intermediate practitioner — independently produces working results for typical real-world tasks, no hand-holding needed
            4 = Advanced — handles unusual/difficult cases well, understands underlying principles enough to adapt technique deliberately
            5 = Expert — thinks at the level of overall design/strategy, understands deep mechanics, can diagnose or improve on suboptimal approaches

            Use the bio, education, and project entries only as corroborating
            evidence for the depth of the PROFICIENT skills (e.g. a listed project
            using that exact skill at nontrivial scope supports a higher level; its
            absence is a mild signal toward caution, not automatic downgrade).

            primarySkill MUST be chosen from the proficient skills list, not the
            to-learn list. focusTopics MUST be specific sub-topics/paradigms within
            that primary proficient skill — for example, for "React": "hooks and
            closures", "reconciliation/rendering behavior", "state management
            patterns"; for "Guitar": "barre chord transitions", "alternate picking
            technique", "reading rhythm notation"; for "Cooking": "knife technique
            and mise en place", "sauce emulsification", "heat control for
            searing". Not generic topics like "basics" or "general skill". At most
            one of the focusTopics may draw from the to-learn list, and only if
            it's a direct, closely related extension of the primary skill.

            Return JSON with: startingLevel (int 1-5), primarySkill (string),
            focusTopics (list of 3-4 specific topics to test), rationale (2-3
            sentences explaining the level choice, explicitly referencing which
            proficient-skill evidence — bio/education/projects — supports it).
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
        You are an expert assessment designer and senior subject matter expert
        specifically in %s. Generate %d questions for this assessment:
        - Domain/Skill: %s
        - Level: %d/5 — %s
        - Topics to cover (these came from analyzing the user's claimed PROFICIENCY
          in %s specifically — go deep on these, not generic %s trivia): %s
        - Mix: %d MCQ, %d practical/hands-on, %d aptitude/logic
        - Session ID: %s

        ROLE & ADAPTABILITY RULE:
        Tailor the tone and substance perfectly to the Domain (%s).
        - If the domain is software/tech: "practical/hands-on" means code-focused tasks, and "aptitude" means system/algorithmic logic.
        - If the domain is non-technical (e.g., Music, Culinary, Business): "practical/hands-on" means real-world execution, troubleshooting workflows, or analysis. Do NOT force a non-technical user to write programming code.

        DEPTH & CORRECTNESS RULE (critical):
        Every question must probe genuine working knowledge of %s at exactly
        level %d — not surface recall of terminology, and not questions that could
        be answered correctly by someone who only skimmed documentation. Prefer
        questions rooted in how %s actually behaves in practice (real gotchas,
        common misconceptions, subtle correctness issues, or design tradeoffs
        practitioners at this level are expected to have hit). Each question must
        map to exactly one of the listed topics above — do not drift into adjacent
        skills or unrelated general-CS trivia just to fill the quota. Double-check
        internally that 'correctAnswer' is factually and technically correct for
        %s before finalizing — an incorrect key is worse than a slightly easier
        question.

        RULES:
        1. MCQ: Must have exactly 4 options labeled A, B, C, D. 'correctAnswer' = label token only (A, B, C, or D). Distractors must be plausible to someone with shallow knowledge, not obviously wrong.
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
                skill, total,                          // line 102: %s %d
                skill,                                  // line 103: %s
                level, LEVEL_DESC.get(level),            // line 104: %d %s
                skill, skill, String.join(", ", topics), // line 106: %s %s %s
                mix[0], mix[1], mix[2],                  // line 107: %d %d %d
                sessionId,                               // line 108: %s
                skill,                                   // line 111: %s
                skill,                                   // line 116: %s
                level,                                   // line 117: %d
                skill,                                   // line 119: %s
                skill,                                   // line 125: %s
                skill,                                   // line 133: %s
                level,                                   // line 134: %d
                level,                                   // line 144: %d
                total                                    // line 157: %d
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