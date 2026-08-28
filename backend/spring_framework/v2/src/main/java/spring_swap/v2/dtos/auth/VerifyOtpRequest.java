package spring_swap.v2.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyOtpRequest {

    @NotBlank(message = "Pre-auth token is required.")
    private String preAuthToken;

    @NotBlank(message = "Verification code is required.")
    @Pattern(regexp = "\\d{6}", message = "Verification code must be exactly 6 digits.")
    private String code;
}