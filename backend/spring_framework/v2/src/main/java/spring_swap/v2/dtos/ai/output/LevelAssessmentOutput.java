package spring_swap.v2.dtos.ai.output;


import java.util.List;

public record LevelAssessmentOutput(
        int startingLevel,
        String primarySkill,
        List<String> focusTopics,
        String rationale
) {}