package utez.edu.mx.tdsw.services.impl;

import utez.edu.mx.tdsw.exception.EmailSendingException;
import utez.edu.mx.tdsw.services.EmailService;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    public EmailServiceImpl(JavaMailSender javaMailSender, TemplateEngine templateEngine) {
        this.javaMailSender = javaMailSender;
        this.templateEngine = templateEngine;
    }

    @Override
    public void sendPasswordResetEmail(String emailTo, String token) {
        // Preparar el contexto para Thymeleaf
        Context context = new Context();
        context.setVariable("token", token);

        // Generar el contenido HTML con Thymeleaf
        String process = templateEngine.process("email", context);

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(emailTo);
            helper.setSubject("Restablecimiento de Contraseña");
            helper.setText(process, true);

            javaMailSender.send(mimeMessage);
        } catch (Exception e) {
            throw new EmailSendingException("Error al enviar el correo de restablecimiento de contraseña", e);
        }
    }
}