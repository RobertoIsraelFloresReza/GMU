package utez.edu.mx.tdsw.models.fcmtoken;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.models.user.UsersRepository;

import java.util.List;
import java.util.Optional;

@Service
public class FcmTokenService {

    private final FcmTokenRepository fcmTokenRepository;
    private final UsersRepository usersRepository;

    public FcmTokenService(FcmTokenRepository fcmTokenRepository, UsersRepository usersRepository) {
        this.fcmTokenRepository = fcmTokenRepository;
        this.usersRepository = usersRepository;
    }

    @Transactional
    public ResponseEntity<ApiResponse> saveToken(FcmTokenDTO dto) {
        try {
            // Validar datos de entrada
            if (dto.getUserId() == null) {
                return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST, true, "userId es requerido"),
                    HttpStatus.BAD_REQUEST
                );
            }

            if (dto.getToken() == null || dto.getToken().trim().isEmpty()) {
                return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.BAD_REQUEST, true, "Token es requerido"),
                    HttpStatus.BAD_REQUEST
                );
            }

            // Buscar usuario
            Optional<Users> userOpt = usersRepository.findById(dto.getUserId());
            if (userOpt.isEmpty()) {
                return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.NOT_FOUND, true, "Usuario no encontrado"),
                    HttpStatus.NOT_FOUND
                );
            }

            Users user = userOpt.get();

            // Verificar si el token ya existe
            Optional<FcmToken> existingToken = fcmTokenRepository.findByToken(dto.getToken());
            if (existingToken.isPresent()) {
                // Si existe, actualizar el usuario y marcar como activo
                FcmToken token = existingToken.get();
                token.setUser(user);
                token.setIsActive(true);
                token = fcmTokenRepository.save(token);
                return new ResponseEntity<>(new ApiResponse(token, HttpStatus.OK), HttpStatus.OK);
            }

            // Crear nuevo token
            FcmToken fcmToken = new FcmToken();
            fcmToken.setUser(user);
            fcmToken.setToken(dto.getToken());

            // Manejar deviceType con valor por defecto
            if (dto.getDeviceType() != null && !dto.getDeviceType().trim().isEmpty()) {
                try {
                    fcmToken.setDeviceType(FcmToken.DeviceType.valueOf(dto.getDeviceType().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    fcmToken.setDeviceType(FcmToken.DeviceType.WEB); // Valor por defecto
                }
            } else {
                fcmToken.setDeviceType(FcmToken.DeviceType.WEB); // Valor por defecto
            }

            fcmToken.setIsActive(true);

            fcmToken = fcmTokenRepository.save(fcmToken);
            return new ResponseEntity<>(new ApiResponse(fcmToken, HttpStatus.CREATED), HttpStatus.CREATED);

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error completo al guardar token FCM: " + e.getClass().getName() + " - " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("Causa: " + e.getCause().getMessage());
            }
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al guardar token: " + e.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getTokensByUser(Long userId) {
        try {
            List<FcmToken> tokens = fcmTokenRepository.findByUser_IdUser(userId);
            return new ResponseEntity<>(new ApiResponse(tokens, HttpStatus.OK), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al obtener tokens"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getActiveTokens() {
        try {
            List<FcmToken> tokens = fcmTokenRepository.findByIsActiveTrue();
            return new ResponseEntity<>(new ApiResponse(tokens, HttpStatus.OK), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al obtener tokens activos"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> deactivateToken(String token) {
        try {
            Optional<FcmToken> fcmTokenOpt = fcmTokenRepository.findByToken(token);
            if (fcmTokenOpt.isEmpty()) {
                return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.NOT_FOUND, true, "Token no encontrado"),
                    HttpStatus.NOT_FOUND
                );
            }

            FcmToken fcmToken = fcmTokenOpt.get();
            fcmToken.setIsActive(false);
            fcmTokenRepository.save(fcmToken);

            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.OK, false, "Token desactivado"),
                HttpStatus.OK
            );
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al desactivar token"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
