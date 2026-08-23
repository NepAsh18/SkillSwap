package spring_swap.v2.document.chat;

public enum EventStatus {
    SCHEDULED,
    STARTED, // join button unlocks here; mediasoup room becomes joinable later
    ENDED,
    CANCELED
}
