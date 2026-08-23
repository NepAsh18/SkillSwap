package spring_swap.v2.dtos.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Payload the client sends to /app/chat/{chatId}/messages/{messageId}/react */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionEventDto {
    private String emoji; // e.g. "❤️", "😂" — sending the same emoji again removes it (toggle)
}