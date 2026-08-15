package spring_swap.v2.dtos.auth;


import jakarta.validation.constraints.Size;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfileUpdateRequest {
    @Size(max = 50)
    private String name;

    @Size(max = 100)
    private String username;

    private String picture;

    @Size(max = 200)
    private String linkedinLink;

    @Size(max = 200)
    private String githubLink;

    @Size(max = 500)
    private String portfolioLink;

    @Size(max = 2000)
    private String bio;

    @Size(max = 2000)
    private String skillsProficient;

    @Size(max = 2000)
    private String skillsToLearn;
}