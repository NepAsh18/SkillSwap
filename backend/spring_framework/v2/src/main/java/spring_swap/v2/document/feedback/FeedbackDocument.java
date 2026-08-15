package spring_swap.v2.document.feedback;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;


@Document(collection = "feedbacks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDocument {

    @Id
    private String id;

    private UUID fromUserId;      // who gave the feedback
    private UUID targetUserId;    // who received it
    private String skill;           // which skill is being rated

    private int stars;              // 1–5
    private String comment;         // optional text


    private double weightApplied;

    private Instant createdAt;
}
