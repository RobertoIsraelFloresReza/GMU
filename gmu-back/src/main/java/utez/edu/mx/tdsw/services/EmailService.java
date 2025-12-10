package utez.edu.mx.tdsw.services;

public interface EmailService {
    void sendPasswordResetEmail(String emailTo, String token);
}
