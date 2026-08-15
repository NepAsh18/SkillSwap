package spring_swap.v2.dtos.auth;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PictureUploadResponse {
    private String url;
}