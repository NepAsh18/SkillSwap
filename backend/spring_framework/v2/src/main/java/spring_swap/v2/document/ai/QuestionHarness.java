package spring_swap.v2.document.ai;


import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "question_harness")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionHarness {

    @Id
    private String id;

    private String skill;
    private String topic;
    private int level;
    private String type;
    private String questionText;
    private List<MCQOption> options;
    private String correctAnswer;
    private String explanation;
    private int timeLimitSeconds;

    // Reranking fields — updated every time this question is served
    private int timesServed;
    private int timesCorrect;
    private double difficultyScore;     // timesCorrect / timesServed → 0.0–1.0
    // low = hard, high = easy

    private Instant createdAt;
    private Instant lastServedAt;

    @TextIndexed                        // enables MongoDB text search on question text
    private String searchableText;      // questionText + topic + skill concatenated
}