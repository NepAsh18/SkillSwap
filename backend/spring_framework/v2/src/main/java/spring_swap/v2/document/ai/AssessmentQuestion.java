package spring_swap.v2.document.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// document/AssessmentQuestion.java
// NOT a @Document — this is an embedded object inside AssessmentSession
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentQuestion {

    private String questionId;      // e.g. "q1", "q2"
    private String harnessId;       // links back to QuestionHarness if reused
    private String type;            // MCQ | CODING | APTITUDE
    private String topic;
    private int level;
    private String questionText;
    private List<MCQOption> options;
    private String correctAnswer;
    private String explanation;
    private int timeLimitSeconds;

    // Evaluation result — filled after Phase 3
    private Boolean correct;
    private Integer score;
    private String userAnswer;
    private String feedback;
}