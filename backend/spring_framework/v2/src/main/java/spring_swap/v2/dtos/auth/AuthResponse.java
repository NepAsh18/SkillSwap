package spring_swap.v2.dtos.auth;



import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private ProfileResponse user;
}