package spring_swap.v2.helpers.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import spring_swap.v2.helpers.AgeProofVerifier;

@Slf4j
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
            log.warn("Received blank/null zkProof");
            return false;
        }

        try {
            JsonNode parsed = objectMapper.readTree(zkProof);
            if (!parsed.has("y") || !parsed.has("t") || !parsed.has("s")) {
                log.warn("Malformed proof JSON, missing y/t/s. Raw body: {}", zkProof);
                return false;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(zkProof, headers);

            log.info("Forwarding proof to verifier service at {}: {}", verifyUrl, zkProof);

            JsonNode response = restTemplate.postForObject(verifyUrl, request, JsonNode.class);

            boolean valid = response != null
                    && response.has("valid")
                    && response.get("valid").asBoolean(false);

            log.info("Verifier service response: {}", response);

            if (!valid) {
                log.warn("Proof rejected. Reason: {}",
                        response != null && response.has("reason") ? response.get("reason").asText() : "no response body");
            }

            return valid;

        } catch (Exception e) {
            log.error("Exception while verifying proof", e);
            return false;
        }
    }
}