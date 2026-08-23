package spring_swap.v2.exceptions;

/**
 * Thrown for chat/group domain rule violations (group size cap, leader-only
 * actions, non-connection member attempts, etc). Kept separate from
 * IllegalArgumentException/IllegalStateException used elsewhere in the
 * connection module so chat-specific errors can be mapped to a distinct
 * HTTP status by a @ControllerAdvice if you already have one — otherwise
 * it'll fall through to your default exception handling.
 */
public class ChatDomainException extends RuntimeException {
    public ChatDomainException(String message) {
        super(message);
    }
}