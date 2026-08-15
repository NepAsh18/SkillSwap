package spring_swap.v2.dtos.notificaton;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCountResponse {
    private long unread;
    private long total;
}
