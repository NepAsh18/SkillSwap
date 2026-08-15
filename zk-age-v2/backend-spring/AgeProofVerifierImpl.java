package spring_swap.v2.helpers.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import spring_swap.v2.helpers.AgeProofVerifier;


@Component
public class AgeProofVerifierImpl implements AgeProofVerifier {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String verifyUrl;

    public AgeProofVerifierImpl(
            RestTemplate restTemplate,
            @Value("${zk.verifier.url:http://localhost:8001/verify}") String verifyUrl
    ) {
        this.restTemplate = restTemplate;
        this.verifyUrl = verifyUrl;
    }

    @Override
    public boolean verify(String zkProof) {
        if (zkProof == null || zkProof.isBlank()) {
            return false;
        }

        try {
            // Basic shape check before forwarding.
            JsonNode parsed = objectMapper.readTree(zkProof);
            if (!parsed.has("y") || !parsed.has("t") || !parsed.has("s")) {
                return false;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(zkProof, headers);

            JsonNode response = restTemplate.postForObject(verifyUrl, request, JsonNode.class);

            return response != null
                    && response.has("valid")
                    && response.get("valid").asBoolean(false);

        } catch (Exception e) {
            // Fail closed: anything unexpected means "not verified".
            return false;
        }
    }
}
