package spring_swap.v2.repositories;

import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import spring_swap.v2.domain.SkillStatsDocument;

import java.util.List;

public interface SkillStatsRepository extends ElasticsearchRepository<SkillStatsDocument, String> {
    List<SkillStatsDocument> findByUserCountGreaterThanOrderByUserCountDesc(long minCount, Pageable pageable);
}