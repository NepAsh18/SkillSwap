package spring_swap.v2.dtos.chat;

import lombok.Data;

import java.time.Instant;

@Data
public class CreateScheduledEventDto {
    private String title;
    private Instant scheduledAt; // must be future, and <= 3 months from now
}
