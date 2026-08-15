package spring_swap.v2.dtos.auth;



import lombok.*;
import spring_swap.v2.models.auth.Provider;
import java.time.Instant;
import java.util.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfileResponse {
    private UUID id;
    private String name;
    private String email;
    private String username;
    private String picture;
    private String linkedinLink;
    private String githubLink;
    private String portfolioLink;
    private String bio;
    private String skillsProficient;
    private String skillsToLearn;
    private Provider provider;
    private Set<String> roles; // Flattened out into standard string representations (e.g. "ROLE_USER")
    private List<EducationResponse> educationList;
    private List<ProjectResponse> projectList;
    private Instant createdAt;
    private Instant updatedAt;
}