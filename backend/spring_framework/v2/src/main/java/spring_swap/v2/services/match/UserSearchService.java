package spring_swap.v2.services.match;



import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import spring_swap.v2.domain.UserSearchDocument;
import org.springframework.scheduling.annotation.Async;
import spring_swap.v2.repositories.UserSearchRepository;
import java.io.IOException;
import java.util.List;


@Service
public class UserSearchService {

    private final ElasticsearchClient client;
    private final String userIndex;
    private final UserSearchRepository userSearchRepository;

    public UserSearchService(
            ElasticsearchClient client,
            @Value("${app.elasticsearch.index.matchmaker-users}") String userIndex,
            UserSearchRepository userSearchRepository
    ) {
        this.client = client;
        this.userIndex = userIndex;
        this.userSearchRepository=  userSearchRepository;
    }

    /** Call this whenever a profile is created/updated. Upserts by userId. */
    @Async
    public void indexUser(UserSearchDocument doc) {
        userSearchRepository.save(doc);
    }

    public void deleteUser(String userId) {
        userSearchRepository.deleteById(userId);
    }

    /**
     * Fuzzy full-text search across name/bio/skills — typo-tolerant.
     * Use for the main "Discover" search bar.
     */
    public List<UserSearchDocument> fuzzySearch(String queryText, int page, int size) throws IOException {
        Query query = Query.of(q -> q
                .multiMatch(m -> m
                        .query(queryText)
                        .fields("name", "bio", "skillsProficient", "skillsToLearn")
                        .fuzziness("AUTO")   // typo tolerance, e.g. "phyton" -> "python"
                        .prefixLength(1)
                )
        );

        SearchResponse<UserSearchDocument> response = client.search(s -> s
                        .index(userIndex)
                        .query(query)
                        .from(page * size)
                        .size(size),
                UserSearchDocument.class
        );

        return response.hits().hits().stream()
                .map(h -> h.source())
                .toList();
    }

    /**
     * Autocomplete: as-you-type suggestions against the edge_ngram analyzer
     * defined on skillsProficient/skillsToLearn. Use for the search bar's
     * dropdown suggestions, hit this on every keystroke (debounced client-side).
     */
    public List<UserSearchDocument> autocomplete(String partialText, int size) throws IOException {
        Query query = Query.of(q -> q
                .multiMatch(m -> m
                                .query(partialText)
                                .fields("skillsProficient", "skillsToLearn")
                        // no fuzziness here — edge_ngram already gives prefix matching
                )
        );

        SearchResponse<UserSearchDocument> response = client.search(s -> s
                        .index(userIndex)
                        .query(query)
                        .size(size),
                UserSearchDocument.class
        );

        return response.hits().hits().stream()
                .map(h -> h.source())
                .toList();
    }

    /**
     * Candidate pool for "top matches": everyone who teaches at least one
     * skill the seeker wants to learn. This is the ES equivalent of your
     * old SQL "initial candidate pool" query — cheap filter before the
     * expensive CompositeScorer math runs only on this smaller set.
     */
    public List<UserSearchDocument> candidatesTeachingAnyOf(List<String> desiredSkills, int size) throws IOException {
        Query query = Query.of(q -> q
                .terms(t -> t
                        .field("skillsProficient.keyword")
                        .terms(ts -> ts.value(desiredSkills.stream()
                                .map(co.elastic.clients.elasticsearch._types.FieldValue::of)
                                .toList()))
                )
        );

        SearchResponse<UserSearchDocument> response = client.search(s -> s
                        .index(userIndex)
                        .query(query)
                        .size(size),
                UserSearchDocument.class
        );

        return response.hits().hits().stream()
                .map(h -> h.source())
                .toList();
    }
}
