package utez.edu.mx.tdsw.controllers.error;

import utez.edu.mx.tdsw.annotation.LogAuditoria;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/error")
public class CustomErrorController implements ErrorController {

    @GetMapping
    @LogAuditoria
    public String handleError() {
        return "error/error"; // Redirige a la vista personalizada
    }
}