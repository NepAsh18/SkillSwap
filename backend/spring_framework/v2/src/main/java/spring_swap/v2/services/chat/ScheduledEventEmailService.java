package spring_swap.v2.services.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledEventEmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    private static final DateTimeFormatter DISPLAY_FORMAT =
            DateTimeFormatter.ofPattern("EEEE, MMM d 'at' h:mm a").withZone(ZoneId.systemDefault());

    public void sendEventScheduledEmail(String toEmail, String schedulerName, String eventTitle, Instant scheduledAt) {
        send(toEmail,
                "New call scheduled: " + eventTitle,
                schedulerName + " scheduled \"" + eventTitle + "\" for " + DISPLAY_FORMAT.format(scheduledAt)
                        + " on SpringSwap. You'll get another email when it starts.");
    }

    public void sendEventStartingEmail(String toEmail, String eventTitle) {
        send(toEmail,
                "\"" + eventTitle + "\" is starting now",
                "\"" + eventTitle + "\" is starting now on SpringSwap. Log in to join the call.");
    }

    public void sendEventCanceledEmail(String toEmail, String eventTitle) {
        send(toEmail,
                "Call canceled: " + eventTitle,
                "\"" + eventTitle + "\" on SpringSwap has been canceled.");
    }

    private void send(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("Mail disabled (app.mail.enabled=false); skipping email to {} [{}]", to, subject);
            return;
        }
        if (to == null || to.isBlank()) {
            log.warn("Skipping scheduled-event email — recipient has no email on file. Subject: {}", subject);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send scheduled-event email to {}", to, e);
        }
    }
}
