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
 * Tracks how many users have BOTH skillA and skillB in their skillsProficient
 * set. skillA/skillB are always stored in sorted order so (React, Vue) and
 * (Vue, React) resolve to the same document — id is "skillA::skillB".
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "skill-pairs")
public class SkillPairDocument {

    @Id
    private String id; // e.g. "django::python"

    @Field(type = FieldType.Keyword)
    private String skillA;

    @Field(type = FieldType.Keyword)
    private String skillB;

    @Field(type = FieldType.Long)
    private long pairCount;
}