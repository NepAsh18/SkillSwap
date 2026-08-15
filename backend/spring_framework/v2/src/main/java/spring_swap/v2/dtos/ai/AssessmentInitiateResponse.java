package spring_swap.v2.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// dto/ai/AssessmentInitiateResponse.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentInitiateResponse {
    private String sessionId;
    private String skill;
    private int level;
    private int totalQuestions;
    private List<QuestionDto> questions;   // no correct_answer exposed
}