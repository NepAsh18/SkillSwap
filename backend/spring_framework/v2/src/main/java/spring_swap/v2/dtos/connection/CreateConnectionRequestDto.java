package spring_swap.v2.dtos.connection;

import lombok.Data;

@Data
public class CreateConnectionRequestDto {
    private String receiverId;
    private String receiverName;
    private String receiverUsername;
    private String receiverPicture;
}