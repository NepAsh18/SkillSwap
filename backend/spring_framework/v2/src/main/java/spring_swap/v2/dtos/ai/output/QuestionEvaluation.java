package spring_swap.v2.dtos.ai.output;

// ai/output/QuestionEvaluation.java
public record QuestionEvaluation(
        String questionId,
        boolean correct,
        int score,
        String userAnswer,
        String correctAnswer,
        String feedback
) {}
