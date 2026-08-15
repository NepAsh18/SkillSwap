package spring_swap.v2.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerSubmitRequest {
    private List<UserAnswerDto> answers;
}