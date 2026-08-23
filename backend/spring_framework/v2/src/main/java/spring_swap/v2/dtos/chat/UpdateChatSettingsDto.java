package spring_swap.v2.dtos.chat;

import lombok.Data;

@Data
public class UpdateChatSettingsDto {
    private Boolean temporaryDefault;
    private Long temporaryDurationMinutes;
}
