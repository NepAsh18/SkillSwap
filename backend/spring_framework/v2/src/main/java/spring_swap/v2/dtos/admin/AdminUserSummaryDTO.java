package spring_swap.v2.dtos.admin;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserSummaryDTO {

    private UUID id;
    private String name;
    private String email;
    private String username;

    private List<String> roles;

    private String skillsProficient;
    private String skillsToLearn;

    // Badge info — nullable, a user may have zero badges or many (one per skill)
    private List<BadgeSummaryDTO> badges;

    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BadgeSummaryDTO {
        private String skill;
        private String tier;
        private int currentLevel;
    }
}