package spring_swap.v2.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// dto/ai/QuestionDto.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private String questionId;
    private String type;
    private String topic;
    private int level;
    private String questionText;
    private List<MCQOptionDto> options;    // null for non-MCQ
    private int timeLimitSeconds;
}