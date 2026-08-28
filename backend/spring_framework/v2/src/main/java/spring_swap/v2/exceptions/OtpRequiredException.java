package spring_swap.v2.exceptions;

import lombok.Getter;

@Getter
public class OtpRequiredException extends RuntimeException {

    private final String preAuthToken;
    private final long expiresInSeconds;

    public OtpRequiredException(String preAuthToken, long expiresInSeconds) {
        super("OTP verification required to complete authentication.");
        this.preAuthToken = preAuthToken;
        this.expiresInSeconds = expiresInSeconds;
    }
}