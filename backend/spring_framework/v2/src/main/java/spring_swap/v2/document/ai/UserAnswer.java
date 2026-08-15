package spring_swap.v2.document.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

// document/UserAnswer.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAnswer {
    private String questionId;
    private String answer;
    private Instant answeredAt;
}