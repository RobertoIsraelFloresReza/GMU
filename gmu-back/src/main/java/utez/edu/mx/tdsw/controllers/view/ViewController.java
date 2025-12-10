package utez.edu.mx.tdsw.controllers.view;

import utez.edu.mx.tdsw.annotation.LogAuditoria;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @GetMapping("/")
    @LogAuditoria
    public String showView(Model model) {
        String folder = activeProfile != null ? activeProfile : "default";
        return folder + "/index"; // Retorna la vista correspondiente
    }
}