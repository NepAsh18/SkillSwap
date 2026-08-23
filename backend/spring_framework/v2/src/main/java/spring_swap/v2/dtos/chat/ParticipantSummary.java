package spring_swap.v2.dtos.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public  class ParticipantSummary {
    private String name;
    private String username;
    private String picture;
}
