package spring_swap.v2.dtos.auth;



import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EducationResponse {
    private UUID id;
    private String institution;
    private String degree;
    private Instant startDate;
    private Instant endDate;
    private Double score;
    private String description;
}