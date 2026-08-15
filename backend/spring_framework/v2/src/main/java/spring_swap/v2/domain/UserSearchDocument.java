package spring_swap.v2.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;
import java.util.Set;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "#{@environment.getProperty('app.elasticsearch.index.matchmaker-users')}")
// Spring Data Elasticsearch writes a hidden "_class" field on every save
// (via ElasticsearchRepository) for its own polymorphic deserialization
// support. UserSearchService's autocomplete()/fuzzySearch() read documents
// back using the raw ElasticsearchClient with a plain Jackson mapper, which
// has no knowledge of "_class" and throws UnrecognizedPropertyException
// without this annotation. Required regardless of which path writes the doc.
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserSearchDocument {

    @Id
    private String userId; // store UUID.toString()

    @Field(type = FieldType.Keyword)
    private String username;

    @Field(type = FieldType.Text)
    private String name;

    @Field(type = FieldType.Text)
    private String bio;

    // Analyzer mapping (autocomplete_analyzer / search_analyzer) is defined
    // server-side in the manual index creation, so we mark these as Text
    // without re-specifying analyzers here — Spring Data ES will respect
    // the existing mapping since we disabled auto index creation for this
    // entity (see UserSearchIndexService).
    @Field(type = FieldType.Text)
    private Set<String> skillsProficient;

    @Field(type = FieldType.Text)
    private Set<String> skillsToLearn;

    @Field(type = FieldType.Keyword)
    private String topBadgeTier;

    @Field(type = FieldType.Float)
    private double reputationScore;

    // ── New fields ─────────────────────────────────────────────

    @Field(type = FieldType.Text)
    private List<String> education; // flattened display strings, e.g. "BSc CS - MIT (2020)"

    @Field(type = FieldType.Text)
    private List<String> projects; // flattened display strings, e.g. project titles/descriptions

    // Weighted average of AI assessment scores across the user's skills,
    // weighted 2x toward skillsProficient vs skillsToLearn, since a user's
    // proficiency (what they can teach) matters more for matching than
    // what they're trying to learn.
    @Field(type = FieldType.Float)
    private double skillAssessmentScore;
}