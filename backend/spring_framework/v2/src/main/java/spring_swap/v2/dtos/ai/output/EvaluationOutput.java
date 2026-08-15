package spring_swap.v2.dtos.ai.output;

import java.util.List;


public record EvaluationOutput(
        int totalScore,
        boolean passed,
        int nextLevel,
        String overallFeedback,
        List<QuestionEvaluation> results
) {}