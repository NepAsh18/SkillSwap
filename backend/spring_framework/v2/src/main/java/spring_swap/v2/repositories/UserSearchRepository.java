package spring_swap.v2.repositories;



import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;
import spring_swap.v2.domain.UserSearchDocument;


@Repository
public interface UserSearchRepository extends ElasticsearchRepository<UserSearchDocument, String> {
}
