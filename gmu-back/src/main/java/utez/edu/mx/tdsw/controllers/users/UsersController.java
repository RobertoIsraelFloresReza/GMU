package utez.edu.mx.tdsw.controllers.users;

import utez.edu.mx.tdsw.annotation.LogAuditoria;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.controllers.users.dto.UsersDto;
import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.services.EmailService;
import utez.edu.mx.tdsw.services.users.UserService;
import jakarta.mail.MessagingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/api/users")
@CrossOrigin(origins = {"*"})
public class UsersController {
    // Constantes para literales repetidos
    private static final String ERROR_KEY = "error";
    private static final String MESSAGE_KEY = "message";
    private static final String USER_ID_KEY = "userId";
    private static final String ID_MISMATCH_MSG = "ID de usuario no coincide";
    private static final String USER_NOT_FOUND_MSG = "No se encontró usuario con ese correo electrónico.";
    private static final String EMAIL_SENT_MSG = "Se ha enviado un correo electrónico con instrucciones para restablecer la contraseña.";
    private static final String INVALID_TOKEN_MSG = "Token inválido, expirado o ya fue usado";
    private static final String UPDATED_MSG = "Contraseña actualizada exitosamente";

    private final UserService usersService;
    private final EmailService emailService;

    public UsersController(UserService usersService, EmailService emailService) {
        this.usersService = usersService;
        this.emailService = emailService;
    }

    /// ESTE YA NO ES NECESARIO, NO SE UTILIZA EN EL FRONT PERO PUEDE SER USADO EN POSTMAN PARA VER TODOS LOS USUARIOS
    @GetMapping("/")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAll() {
        return usersService.getAll();
    }

    @GetMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long id) {
        return usersService.getUserById(id);
    }

    @PostMapping("/")
    @LogAuditoria
    public ResponseEntity<ApiResponse> saveUser(@RequestBody UsersDto worker) {
        return usersService.saveUser(worker.toEntity());
    }

    @PutMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updateUserById(@PathVariable Long id, @RequestBody UsersDto userDto) {
        if (!id.equals(userDto.getIdUser())) {
            return new ResponseEntity<>(new ApiResponse(
                    HttpStatus.BAD_REQUEST, true, ID_MISMATCH_MSG
            ), HttpStatus.BAD_REQUEST);
        }
        return usersService.updateUserById(userDto.toEntity());
    }

    @DeleteMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> deleteUserById(@PathVariable Long id) {
        return usersService.deleteUserById(id);
    }

    @PatchMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> changeStatus(@PathVariable Long id) {
        return usersService.changeStatus(id);
    }

    @GetMapping("/by-email/{email}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> findByEmail(@PathVariable String email) {
        return usersService.findByEmailHandler(email);
    }

    @PostMapping("/request-password-reset")
    @LogAuditoria
    public ResponseEntity<Map<String, Object>> requestPasswordReset(@RequestBody Map<String, String> body) throws MessagingException {
        String email = body.get("email");
        Optional<Users> userOptional = usersService.findByEmail(email);

        if (!userOptional.isPresent()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(ERROR_KEY, USER_NOT_FOUND_MSG);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }

        Users user = userOptional.get();
        String token = usersService.generatePasswordResetToken(user.getIdUser());
        emailService.sendPasswordResetEmail(user.getEmail(), token);

        Map<String, Object> response = new HashMap<>();
        response.put(MESSAGE_KEY, EMAIL_SENT_MSG);
        response.put(USER_ID_KEY, user.getIdUser());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @LogAuditoria
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        Long idUser = Long.valueOf(body.get("idUser"));

        try {
            if (!usersService.validateToken(token)) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put(ERROR_KEY, INVALID_TOKEN_MSG);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            usersService.updatePassword(idUser, newPassword);
            usersService.markTokenAsUsed(token);

            Map<String, String> successResponse = new HashMap<>();
            successResponse.put(MESSAGE_KEY, UPDATED_MSG);
            return ResponseEntity.ok(successResponse);
        } catch (RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(ERROR_KEY, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/verify-password")
    @LogAuditoria
    public ResponseEntity<Map<String, Object>> verifyPassword(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get(USER_ID_KEY).toString());
        String password = (String) request.get("password");
        return usersService.verifyPassword(userId, password);
    }

    @PutMapping("/{id}/password")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updateUserPassword(@PathVariable Long id, @RequestBody Map<String, String> passwords) {
        String currentPassword = passwords.get("currentPassword");
        String newPassword = passwords.get("newPassword");
        return usersService.updateUserPassword(id, currentPassword, newPassword);
    }
}