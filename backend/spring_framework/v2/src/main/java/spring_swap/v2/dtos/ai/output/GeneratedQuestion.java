package spring_swap.v2.dtos.ai.output;

import java.util.List;


public record GeneratedQuestion(
        String id,
        String type,
        String topic,
        int level,
        String question,
        List<GeneratedOption> options,
        String correctAnswer,
        String explanation,
        int timeLimitSeconds
) {

    public record GeneratedOption(String label, String text) {
    }
}