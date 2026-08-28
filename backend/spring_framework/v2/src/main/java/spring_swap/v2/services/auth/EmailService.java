package spring_swap.v2.services.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import spring_swap.v2.models.auth.OtpPurpose;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public void sendOtpEmail(String toEmail, String code, OtpPurpose purpose, long ttlSeconds) {
        String subject = purpose == OtpPurpose.REGISTER
                ? "Verify your SkillSwap account"
                : "Your SkillSwap login code";

        long ttlMinutes = Math.max(1, ttlSeconds / 60);

        String body = String.format(
                "Your verification code is: %s%n%nThis code expires in %d minutes. If you didn't request this, you can safely ignore this email.",
                code, ttlMinutes
        );

        if (!mailEnabled) {
            log.info("[MAIL DISABLED] Would send OTP email to {} | subject='{}' | code={}", toEmail, subject, code);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        log.info("OTP email sent to {}", toEmail);
    }
}