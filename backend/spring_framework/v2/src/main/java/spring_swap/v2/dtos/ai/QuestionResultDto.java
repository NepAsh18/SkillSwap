package spring_swap.v2.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// dto/ai/QuestionResultDto.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResultDto {
    private String questionId;
    private boolean correct;
    private int score;
    private String userAnswer;
    private String correctAnswer;
    private String feedback;
}