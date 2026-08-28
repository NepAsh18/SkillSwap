package spring_swap.v2.dtos.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminAnalyticsDTO {

    private long totalUsers;
    private long totalBadges;
    private long totalProficientSkills;

    private List<ChartDataDTO> roleDistribution;
    private List<ChartDataDTO> badgeDistribution;
    private List<ChartDataDTO> topProficientSkills;
    private List<ChartDataDTO> topSkillsToLearn;
    private List<ChartDataDTO> badgeLevelDistribution;

    @Data
    @Builder
    public static class ChartDataDTO {
        private String name;
        private long count;
    }
}