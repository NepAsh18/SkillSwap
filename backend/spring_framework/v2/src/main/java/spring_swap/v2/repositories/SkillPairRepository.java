package spring_swap.v2.repositories;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import spring_swap.v2.domain.SkillPairDocument;

import java.util.List;

public interface SkillPairRepository extends ElasticsearchRepository<SkillPairDocument, String> {
    List<SkillPairDocument> findBySkillA(String skillA);
    List<SkillPairDocument> findBySkillB(String skillB);
}