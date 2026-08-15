package spring_swap.v2.services.connection;



import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConnectionEmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    public void sendConnectionRequestEmail(String toEmail, String senderName) {
        send(toEmail,
                "New connection request on SpringSwap",
                senderName + " wants to connect with you on SpringSwap. Log in to accept or decline.");
    }

    public void sendConnectionAcceptedEmail(String toEmail, String accepterName) {
        send(toEmail,
                "Your connection request was accepted",
                accepterName + " accepted your connection request on SpringSwap. You can now message each other.");
    }

    public void sendConnectionCanceledEmail(String toEmail, String cancelerName) {
        send(toEmail,
                "A connection request was withdrawn",
                cancelerName + " withdrew their connection request on SpringSwap.");
    }

    private void send(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("Mail disabled (app.mail.enabled=false); skipping email to {} [{}]", to, subject);
            return;
        }
        if (to == null || to.isBlank()) {
            log.warn("Skipping connection email — recipient has no email on file. Subject: {}", subject);
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
            log.error("Failed to send connection email to {}", to, e);
        }
    }


}
