package utez.edu.mx.tdsw.controllers.error;
import utez.edu.mx.tdsw.annotation.LogAuditoria;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProfileController {

    @Value("${app.environment:default}")
    private String environment;

    @GetMapping("/profile")
    @LogAuditoria
    public String getActiveProfile() {
        return "Perfil activo: " + environment;
    }

    @GetMapping("/error-test")
    @LogAuditoria
    public String errorTest() {
        return "Error test endpoint";
    }

}