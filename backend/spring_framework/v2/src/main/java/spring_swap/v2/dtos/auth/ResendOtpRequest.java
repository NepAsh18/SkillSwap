package spring_swap.v2.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResendOtpRequest {

    @NotBlank(message = "Pre-auth token is required.")
    private String preAuthToken;
}