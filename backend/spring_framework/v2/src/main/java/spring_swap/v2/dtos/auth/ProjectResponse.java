package spring_swap.v2.dtos.auth;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProjectResponse {
    private UUID id;
    private String title;
    private String description;
    private String projectLink;
    private String techStack;
    private Instant startDate;
    private Instant endDate;
}