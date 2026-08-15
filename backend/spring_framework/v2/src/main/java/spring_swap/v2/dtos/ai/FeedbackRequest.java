package spring_swap.v2.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {
    private String fromUserId;
    private String type;
    private String comment;
}