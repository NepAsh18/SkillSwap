package spring_swap.v2.document.chat;

public enum ScheduledEventNotificationType {
    EVENT_SCHEDULED,   // fired to other participants when someone schedules a call
    EVENT_STARTING,    // fired to all participants at scheduledAt (join button unlocks)
    EVENT_CANCELED
}
