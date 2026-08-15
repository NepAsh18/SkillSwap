package spring_swap.v2.repository.ai;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import spring_swap.v2.document.ai.QuestionHarness;

import java.util.List;


@Repository
public interface QuestionHarnessRepository
        extends MongoRepository<QuestionHarness, String> {

    // Used for cache lookup before calling LLM
    List<QuestionHarness> findBySkillAndLevelAndType(
            String skill, int level, String type
    );

    List<QuestionHarness> findBySkillAndLevelAndTopic(String skill, int level, List<String> topics);

    // For reranking — find questions by difficulty range
    List<QuestionHarness> findBySkillAndLevelAndDifficultyScoreBetween(
            String skill, int level, double min, double max
    );

    // Full text search (MongoDB text index on searchableText)
    @Query("{ $text: { $search: ?0 }, skill: ?1, level: ?2 }")
    List<QuestionHarness> searchByTextSkillAndLevel(
            String text, String skill, int level
    );
}

