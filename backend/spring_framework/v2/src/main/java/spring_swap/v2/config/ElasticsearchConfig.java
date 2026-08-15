package spring_swap.v2.config;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.indices.CreateIndexRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

import java.io.StringReader;

@Configuration
@EnableElasticsearchRepositories(basePackages = "spring_swap.v2.repositories")
public class ElasticsearchConfig {

    @Value("${app.elasticsearch.index.matchmaker-users}")
    private String userIndex;

    private final ElasticsearchClient client;

    public ElasticsearchConfig(ElasticsearchClient client) {
        this.client = client;
    }

    @PostConstruct
    public void ensureIndex() {
        try {
            boolean exists = client.indices().exists(e -> e.index(userIndex)).value();
            if (exists) return;

            String settings = """
    {
      "settings": {
        "analysis": {
          "tokenizer": {
            "edge_ngram_tokenizer": {
              "type": "edge_ngram",
              "min_gram": 2,
              "max_gram": 20,
              "token_chars": ["letter", "digit"]
            }
          },
          "analyzer": {
            "autocomplete_analyzer": {
              "type": "custom",
              "tokenizer": "edge_ngram_tokenizer",
              "filter": ["lowercase"]
            },
            "search_analyzer": {
              "type": "custom",
              "tokenizer": "standard",
              "filter": ["lowercase"]
            }
          }
        }
      },
      "mappings": {
        "properties": {
          "userId":            { "type": "keyword" },
          "username":          { "type": "keyword" },
          "name":              { "type": "text" },
          "bio":               { "type": "text" },
          "skillsProficient":  {
            "type": "text",
            "analyzer": "autocomplete_analyzer",
            "search_analyzer": "search_analyzer",
            "fields": { "keyword": { "type": "keyword" } }
          },
          "skillsToLearn":     {
            "type": "text",
            "analyzer": "autocomplete_analyzer",
            "search_analyzer": "search_analyzer",
            "fields": { "keyword": { "type": "keyword" } }
          },
          "topBadgeTier":      { "type": "keyword" },
          "reputationScore":   { "type": "float" }
        }
      }
    }
    """;
            client.indices().create(CreateIndexRequest.of(c -> c
                    .index(userIndex)
                    .withJson(new StringReader(settings))
            ));
        } catch (Exception e) {
            System.err.println("[ElasticsearchConfig] Index setup failed: " + e.getMessage());
        }
    }
}