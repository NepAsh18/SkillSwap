package spring_swap.v2.dtos.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreAuthResponse {
    private String preAuthToken;
    private String message;
    private long expiresInSeconds;

    @Builder.Default
    private boolean otpRequired = true;
}