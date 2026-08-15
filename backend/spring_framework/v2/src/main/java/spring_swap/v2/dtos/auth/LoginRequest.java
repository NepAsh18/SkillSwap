package spring_swap.v2.dtos.auth;



import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Email or username is required")
    private String identity; // Supports logging in with email OR username natively

    @NotBlank(message = "Password is required")
    private String password;
}