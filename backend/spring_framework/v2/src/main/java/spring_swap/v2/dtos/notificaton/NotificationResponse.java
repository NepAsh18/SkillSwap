package spring_swap.v2.dtos.notificaton;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private String id;
    private String type;
    private String title;
    private String body;
    private String subjectUserName;
    private String skill;
    private String newTier;
    private boolean read;
    private Instant createdAt;
}