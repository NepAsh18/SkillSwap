
package spring_swap.v2.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProjectRequest {
    @NotBlank @Size(max = 150)
    private String title;
    @Size(max = 1000)
    private String description;
    @Size(max = 300)
    private String projectLink;
    @Size(max = 300)
    private String techStack;
    private Instant startDate;
    private Instant endDate;
}