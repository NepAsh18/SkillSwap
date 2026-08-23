package spring_swap.v2.dtos.chat;

import lombok.Data;

@Data
public class SendMessageDto {
    private String content;
    // If null, service falls back to the sender's ChatParticipantSettingsDocument.temporaryDefault.
    // If explicitly set, overrides the default for this one message.
    private Boolean temporary;
    private Long temporaryDurationMinutes; // required if temporary resolves true
    private String replyToMessageId; // optional — set when replying to a specific message in this chat
}