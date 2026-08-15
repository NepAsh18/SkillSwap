package spring_swap.v2.exceptions;


public class CooldownException extends RuntimeException {
    public CooldownException(String message) {
        super(message);
    }
}