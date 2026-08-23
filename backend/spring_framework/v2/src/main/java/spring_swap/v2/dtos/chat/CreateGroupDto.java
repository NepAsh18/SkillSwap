package spring_swap.v2.dtos.chat;

import lombok.Data;

import java.util.List;

@Data
public class CreateGroupDto {
    private String name;
    // Other participant userIds, NOT including the leader (leader = current user).
    // Service enforces: 1 <= memberIds.size() <= 4, so total group size (incl. leader) <= 5.
    private List<String> memberIds;
    private String avatarUrl; // optional
}
