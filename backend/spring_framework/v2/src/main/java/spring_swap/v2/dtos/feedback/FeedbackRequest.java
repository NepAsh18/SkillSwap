package spring_swap.v2.dtos.feedback;


import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {
    @NotNull
    private UUID targetUserId;

    @NotNull
    private String skill;

    @Min(1) @Max(5)
    private int stars;

    private String comment;   // optional
}
