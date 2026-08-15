package spring_swap.v2.services.connection;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import spring_swap.v2.document.connection.ConnectionRequestDocument;
import spring_swap.v2.services.auth.ProfileService;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConnectionNotifier {

    private final ConnectionInAppNotificationService inAppService;
    private final ConnectionEmailService emailService;
    private final ProfileService profileService;



    public void notifyRequestCreated(ConnectionRequestDocument req) {

        try {
            inAppService.notifyRequestReceived(req);
        } catch (Exception e) {
            log.error("Failed to create in-app notification", e);
        }

        try {
            String email = resolveEmail(req.getReceiverId());
            emailService.sendConnectionRequestEmail(email, req.getSenderName());
        } catch (Exception e) {
            log.error("Failed to send email", e);
        }
    }
    public void notifyRequestAccepted(ConnectionRequestDocument req) {
        inAppService.notifyRequestAccepted(req);
        String senderEmail = resolveEmail(req.getSenderId());
        emailService.sendConnectionAcceptedEmail(senderEmail, req.getReceiverName());
    }

    public void notifyRequestDeclined(ConnectionRequestDocument req) {
        inAppService.notifyRequestDeclined(req);

    }

    public void notifyRequestCanceled(ConnectionRequestDocument req) {
        inAppService.notifyRequestCanceled(req);
        String receiverEmail = resolveEmail(req.getReceiverId());
        emailService.sendConnectionCanceledEmail(receiverEmail, req.getSenderName());
    }

    private String resolveEmail(String userId) {
        try {

            var profile = profileService.getProfile(UUID.fromString(userId));
            return profile.getEmail();
        } catch (Exception e) {
            return null;
        }
    }
}