
package spring_swap.v2.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EducationRequest {
    @NotBlank @Size(max = 150)
    private String institution;
    @NotBlank @Size(max = 150)
    private String degree;
    private Instant startDate;
    private Instant endDate;
    private Double score;
    @Size(max = 1000)
    private String description;
}