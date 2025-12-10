package utez.edu.mx.tdsw.controllers.fcmtoken;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.fcmtoken.FcmTokenDTO;
import utez.edu.mx.tdsw.models.fcmtoken.FcmTokenService;

@RestController
@RequestMapping("/api/fcm-tokens")
@CrossOrigin(origins = {"*"})

    public class FcmTokenController {
    private final FcmTokenService fcmTokenService;

    public FcmTokenController(FcmTokenService fcmTokenService) {
        this.fcmTokenService = fcmTokenService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> saveToken(@RequestBody FcmTokenDTO dto) {
        return fcmTokenService.saveToken(dto);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> getTokensByUser(@PathVariable Long userId) {
        return fcmTokenService.getTokensByUser(userId);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> getActiveTokens() {
        return fcmTokenService.getActiveTokens();
    }

    @DeleteMapping("/{token}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> deactivateToken(@PathVariable String token) {
        return fcmTokenService.deactivateToken(token);
    }
}
