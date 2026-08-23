package spring_swap.v2.dtos.chat;

import lombok.Data;

@Data
public class TypingEventDto {
    private boolean typing; // true = started typing, false = stopped
}
