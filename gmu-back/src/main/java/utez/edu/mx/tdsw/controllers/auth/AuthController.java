package utez.edu.mx.tdsw.controllers.auth;

import utez.edu.mx.tdsw.annotation.LogAuditoria;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.controllers.auth.dto.SignDto;
import utez.edu.mx.tdsw.services.auth.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/auth")
@CrossOrigin(origins = {"*"})
@Controller
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/signin")
    @LogAuditoria
    public ResponseEntity<ApiResponse> signIn(@RequestBody SignDto signDto){
        return service.signIn(signDto.getEmail(),signDto.getPassword());
    }
}
