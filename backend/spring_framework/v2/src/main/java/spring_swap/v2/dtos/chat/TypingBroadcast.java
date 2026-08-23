package spring_swap.v2.dtos.chat;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TypingBroadcast {
    private String chatId;
    private String userId;
    private boolean typing;
}
