package spring_swap.v2.document.ai;


import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// document/AssessmentSession.java
@Document(collection = "assessment_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentSession {

    @Id
    private String id;

    private UUID userId;
    private String skill;
    private int level;
    private String status;

    private List<AssessmentQuestion> questions;   // full question set
    private List<UserAnswer> userAnswers;         // stored on submit

    private Integer totalScore;     // 0–100, filled after evaluation
    private Boolean passed;
    private Integer nextLevel;
    private String overallFeedback;

    private Instant createdAt;
    private Instant completedAt;
}