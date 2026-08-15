package spring_swap.v2.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// dto/ai/UserAnswerDto.java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAnswerDto {
    private String questionId;
    private String answer;
}