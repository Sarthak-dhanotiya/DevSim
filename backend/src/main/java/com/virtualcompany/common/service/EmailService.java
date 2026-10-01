package com.virtualcompany.common.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
public class EmailService {

    private final Optional<JavaMailSender> mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.from:noreply@devsim.com}")
    private String mailFrom;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = Optional.ofNullable(mailSender);
    }

    public void sendWelcomeCredentialsEmail(String toEmail, String studentName, String generatedPassword) {
        String subject = "Welcome to DevSim — Your Developer Account Credentials";
        String loginUrl = frontendUrl.replaceAll("/+$", "") + "/login";

        String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
                        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
                        .header { background: #0f172a; color: #ffffff; padding: 28px 32px; text-align: left; }
                        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
                        .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
                        .content { padding: 32px; font-size: 14px; line-height: 1.6; }
                        .cred-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 24px 0; }
                        .cred-row { margin-bottom: 10px; font-family: monospace; font-size: 13px; }
                        .cred-row strong { color: #475569; display: inline-block; width: 100px; font-family: sans-serif; font-size: 12px; }
                        .btn { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; margin: 16px 0 24px 0; }
                        .footer { border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #64748b; background: #fafafa; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>DevSim — Virtual Company Platform</h1>
                            <p>Simulated Software Engineering Experience</p>
                        </div>
                        <div class="content">
                            <p>Hi <strong>%s</strong>,</p>
                            <p>Welcome to <strong>DevSim</strong>! Your developer account has been created. You can now join simulated software companies, pick up engineering tickets on the Kanban board, and get code reviews from our AI Tech Lead.</p>
                            
                            <div class="cred-box">
                                <div class="cred-row"><strong>Email:</strong> %s</div>
                                <div class="cred-row"><strong>Password:</strong> <span style="font-weight: bold; color: #0284c7; background: #e0f2fe; padding: 2px 8px; border-radius: 4px;">%s</span></div>
                            </div>

                            <a href="%s" class="btn">Sign In to Engineering Workspace &rarr;</a>

                            <p style="color: #64748b; font-size: 12px; margin-top: 16px;">
                                <em>Security tip: Once signed in, you can change your password anytime or use the "Forgot Password" option.</em>
                            </p>
                        </div>
                        <div class="footer">
                            &copy; DevSim Platform • Built by Sarthak Dhanotiya (Associate Software Developer)
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(studentName, toEmail, generatedPassword, loginUrl);

        sendEmail(toEmail, subject, htmlContent);
    }

    public void sendPasswordResetOtpEmail(String toEmail, String studentName, String otpCode) {
        String subject = "DevSim — Password Reset Verification Code";
        String resetUrl = frontendUrl.replaceAll("/+$", "") + "/reset-password?email=" + toEmail + "&otp=" + otpCode;

        String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
                        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
                        .header { background: #0f172a; color: #ffffff; padding: 28px 32px; text-align: left; }
                        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
                        .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
                        .content { padding: 32px; font-size: 14px; line-height: 1.6; }
                        .otp-box { background: #f8fafc; border: 2px dashed #0284c7; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
                        .otp-code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; }
                        .btn { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 13px; font-weight: 600; margin: 16px 0; }
                        .footer { border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #64748b; background: #fafafa; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Verification</h1>
                            <p>DevSim Account Security</p>
                        </div>
                        <div class="content">
                            <p>Hi <strong>%s</strong>,</p>
                            <p>We received a request to reset your password. Use the 6-digit verification code (OTP) below to proceed:</p>
                            
                            <div class="otp-box">
                                <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 8px;">Your One-Time Code (OTP)</span>
                                <div class="otp-code">%s</div>
                                <span style="font-size: 11px; color: #dc2626; display: block; margin-top: 8px;">Expires in 10 minutes</span>
                            </div>

                            <p>You can also reset your password directly by clicking the link below:</p>
                            <a href="%s" class="btn">Reset Password Now &rarr;</a>

                            <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
                                If you did not request a password reset, please ignore this email. Your password will remain unchanged.
                            </p>
                        </div>
                        <div class="footer">
                            &copy; DevSim Platform • Security Notification
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(studentName != null ? studentName : "Developer", otpCode, resetUrl);

        sendEmail(toEmail, subject, htmlContent);
    }

    private void sendEmail(String toEmail, String subject, String htmlContent) {
        if (mailSender.isEmpty() || mailUsername == null || mailUsername.isBlank()) {
            log.info("==================================================================");
            log.info(" [MOCK / LOCAL EMAIL SENDER]");
            log.info(" To: {}", toEmail);
            log.info(" Subject: {}", subject);
            log.info(" SMTP not configured, logging email. To enable real SMTP, configure SPRING_MAIL_USERNAME and SPRING_MAIL_PASSWORD.");
            log.info("==================================================================");
            return;
        }

        try {
            JavaMailSender sender = mailSender.get();
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String senderAddress = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom : mailUsername;
            helper.setFrom(senderAddress, "DevSim Platform");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            sender.send(message);
            log.info("Email successfully sent via SMTP to {}", toEmail);
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}. Continuing without breaking user flow.", toEmail, ex.getMessage());
        }
    }
}
