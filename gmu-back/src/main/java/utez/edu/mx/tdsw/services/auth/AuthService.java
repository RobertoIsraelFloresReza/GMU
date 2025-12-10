package utez.edu.mx.tdsw.services.auth;

import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.controllers.auth.dto.SignedDto;
import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.security.jwt.JwtProvider;
import utez.edu.mx.tdsw.services.users.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Transactional
@Service
public class AuthService {
    // Constantes para mensajes de error
    private static final String CREDENTIALS_MISMATCH = "CredentialMismatch";
    private static final String USER_DISABLED = "UserDisabled";

    private final UserService userService; // Cambiado a minúscula
    private final AuthenticationManager manager;
    private final JwtProvider provider;

    public AuthService(UserService userService, AuthenticationManager manager, JwtProvider provider) {
        this.userService = userService; // Actualizado para coincidir
        this.manager = manager;
        this.provider = provider;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> signIn(String email, String password) {
        try {
            Optional<Users> foundUser = userService.findByEmail(email); // Actualizado aquí
            if (foundUser.isEmpty()) {
                return new ResponseEntity<>(
                        new ApiResponse("Usuario no encontrado", HttpStatus.NOT_FOUND),
                        HttpStatus.NOT_FOUND
                );
            }

            Users users = foundUser.get();
            Authentication auth = manager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
            String token = provider.generateToken(auth);

            SignedDto signedDto = new SignedDto(token, "Bearer", users, users.getRole());
            return new ResponseEntity<>(
                    new ApiResponse(signedDto, HttpStatus.OK),
                    HttpStatus.OK
            );

        } catch (DisabledException e) {
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST, true, USER_DISABLED),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST, true, CREDENTIALS_MISMATCH),
                    HttpStatus.BAD_REQUEST
            );
        }
    }
}