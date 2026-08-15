package spring_swap.v2.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

/**
 * Tracks how many users currently have a given skill in skillsProficient.
 * Used as the marginal probability term P(skill) = userCount / totalUsers
 * when computing NPMI for skill adjacency.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "skill-stats")
public class SkillStatsDocument {

    @Id
    private String skillKey; // lowercased, trimmed skill name

    @Field(type = FieldType.Long)
    private long userCount;
}