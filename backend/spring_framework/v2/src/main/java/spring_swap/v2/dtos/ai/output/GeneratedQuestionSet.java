package spring_swap.v2.dtos.ai.output;


import java.util.List;

public record GeneratedQuestionSet(
        String sessionId,
        String skill,
        int level,
        List<GeneratedQuestion> questions
) {}
