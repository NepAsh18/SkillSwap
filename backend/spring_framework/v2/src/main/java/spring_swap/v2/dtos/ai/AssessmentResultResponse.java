package spring_swap.v2.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// dto/ai/AssessmentResultResponse.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResultResponse {
    private String sessionId;
    private String skill;
    private int level;
    private int totalScore;
    private boolean passed;
    private int nextLevel;
    private String overallFeedback;
    private List<QuestionResultDto> results;
    private BadgeDto badge;
}