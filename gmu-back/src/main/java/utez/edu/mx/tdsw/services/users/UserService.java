package utez.edu.mx.tdsw.services.users;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.passwordreset.PasswordResetToken;
import utez.edu.mx.tdsw.models.passwordreset.PasswordResetTokenRepository;
import utez.edu.mx.tdsw.models.person.Persons;
import utez.edu.mx.tdsw.models.person.PersonsRepository;
import utez.edu.mx.tdsw.models.role.Role;
import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.models.user.UsersRepository;
import org.apache.commons.lang.RandomStringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.tdsw.security.entity.UserDetailsImpl;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class UserService {
    // Constantes para mensajes y claves repetidas
    private static final String VALID_KEY = "valid";
    private static final String EMAIL_EXISTS_MESSAGE = "El correo electrónico ya está registrado";
    private static final String USER_NOT_FOUND_MESSAGE = "Usuario no encontrado";
    private static final int TOKEN_LENGTH = 10;
    private static final int TOKEN_EXPIRATION_HOURS = 1;

    private final UsersRepository usersRepository;
    private final PersonsRepository personsRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UsersRepository usersRepository,
                       PersonsRepository personsRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository) {
        this.usersRepository = usersRepository;
        this.personsRepository = personsRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public ResponseEntity<Map<String, Object>> verifyPassword(Long userId, String password) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<Users> userOpt = usersRepository.findById(userId);
            if (userOpt.isEmpty()) {
                response.put(VALID_KEY, false);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            Users user = userOpt.get();
            if (!user.getPassword().startsWith("$2a$")) {
                response.put(VALID_KEY, false);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }

            response.put(VALID_KEY, passwordEncoder.matches(password, user.getPassword()));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put(VALID_KEY, false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    public ResponseEntity<ApiResponse> findByEmailHandler(String email) {
        return usersRepository.findByEmail(email)
                .map(user -> new ResponseEntity<>(new ApiResponse(user, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(USER_NOT_FOUND_MESSAGE, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getAll() {
        return new ResponseEntity<>(new ApiResponse(usersRepository.findAll(), HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getUserById(Long id) {
        return usersRepository.findById(id)
                .map(user -> new ResponseEntity<>(new ApiResponse(user, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(USER_NOT_FOUND_MESSAGE, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST));
    }

    @Transactional
    public ResponseEntity<ApiResponse> deleteUserById(Long id) {
        if (!usersRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(USER_NOT_FOUND_MESSAGE, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
        }
        usersRepository.deleteById(id);
        return new ResponseEntity<>(new ApiResponse(), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> saveUser(Users worker) {
        if (usersRepository.findByEmail(worker.getEmail()).isPresent()) {
            return new ResponseEntity<>(new ApiResponse(HttpStatus.BAD_REQUEST, true, EMAIL_EXISTS_MESSAGE), HttpStatus.BAD_REQUEST);
        }

        if (worker.getPersons() != null && personsRepository.findByEmail(worker.getPersons().getEmail()).isPresent()) {
            return new ResponseEntity<>(new ApiResponse(HttpStatus.BAD_REQUEST, true, EMAIL_EXISTS_MESSAGE), HttpStatus.BAD_REQUEST);
        }

        worker.setStatus(true);
        worker.setPassword(passwordEncoder.encode(worker.getPassword()));

        if (worker.getPersons() != null) {
            Persons savedPerson = personsRepository.save(worker.getPersons());
            worker.setPersons(savedPerson);
        }

        Users savedUser = usersRepository.save(worker);
        return new ResponseEntity<>(new ApiResponse(savedUser, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> updateUserById(Users updatedUser) {
        return usersRepository.findById(updatedUser.getIdUser())
                .map(existingUser -> {

                    updateUserPasswordIfNeeded(updatedUser, existingUser);

                    if (!updateUserEmailIfValid(updatedUser, existingUser)) {
                        return new ResponseEntity<>(new ApiResponse(EMAIL_EXISTS_MESSAGE, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
                    }

                    updatePersonDetails(updatedUser);
                    Users savedUser = usersRepository.save(existingUser);
                    return new ResponseEntity<>(new ApiResponse(savedUser, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(USER_NOT_FOUND_MESSAGE, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST));
    }

    private void updateUserPasswordIfNeeded(Users updatedUser, Users existingUser) {
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }
    }

    private boolean updateUserEmailIfValid(Users updatedUser, Users existingUser) {
        if (updatedUser.getEmail() != null && !updatedUser.getEmail().isEmpty()
                && !updatedUser.getEmail().equals(existingUser.getEmail())) {
            if (usersRepository.findByEmail(updatedUser.getEmail()).isPresent()) {
                return false;
            }
            existingUser.setEmail(updatedUser.getEmail());
        }
        return true;
    }

    private void updatePersonDetails(Users updatedUser) {
        if (updatedUser.getPersons() != null) {
            Persons updatedPerson = updatedUser.getPersons();
            personsRepository.findById(updatedPerson.getIdPerson()).ifPresent(existingPerson -> {
                updatePersonEmailIfValid(updatedPerson, existingPerson);
                updatePersonBasicInfo(updatedPerson, existingPerson);
                personsRepository.save(existingPerson);
            });
        }
    }

    private void updatePersonEmailIfValid(Persons updatedPerson, Persons existingPerson) {
        if (updatedPerson.getEmail() != null &&
                !updatedPerson.getEmail().isEmpty() &&
                !updatedPerson.getEmail().equals(existingPerson.getEmail()) &&
                personsRepository.findByEmail(updatedPerson.getEmail()).isEmpty()) {
            existingPerson.setEmail(updatedPerson.getEmail());
        }
    }

    private void updatePersonBasicInfo(Persons updatedPerson, Persons existingPerson) {
        Optional.ofNullable(updatedPerson.getName()).ifPresent(existingPerson::setName);
        Optional.ofNullable(updatedPerson.getLastname()).ifPresent(existingPerson::setLastname);
        Optional.ofNullable(updatedPerson.getPhone()).ifPresent(existingPerson::setPhone);
    }

    @Transactional
    public ResponseEntity<ApiResponse> changeStatus(Long id) {
        return usersRepository.findById(id)
                .map(user -> {
                    user.setStatus(!user.getStatus());
                    Users updatedUser = usersRepository.save(user);
                    return new ResponseEntity<>(new ApiResponse(updatedUser, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(USER_NOT_FOUND_MESSAGE, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST));
    }

    @Transactional
    public ResponseEntity<ApiResponse> updatePassword(Long userId, String newPassword) {
        return usersRepository.findById(userId)
                .map(user -> {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    Users updatedUser = usersRepository.save(user);
                    return new ResponseEntity<>(new ApiResponse(updatedUser, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(USER_NOT_FOUND_MESSAGE, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST));
    }

    @Transactional(readOnly = true)
    public Optional<Users> findByEmail(String email) {
        return usersRepository.findByEmail(email);
    }

    @Transactional
    public String generatePasswordResetToken(Long userId) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MESSAGE));

        passwordResetTokenRepository.deleteByUser(user);

        String token = RandomStringUtils.randomAlphanumeric(TOKEN_LENGTH).toUpperCase();
        Date expiryDate = new Date(System.currentTimeMillis() + TOKEN_EXPIRATION_HOURS * 3600000);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(expiryDate);
        resetToken.setUsed(false);

        passwordResetTokenRepository.save(resetToken);
        return token;
    }

    @Transactional(readOnly = true)
    public boolean validateToken(String token) {
        return passwordResetTokenRepository.findByToken(token)
                .map(resetToken -> !resetToken.isUsed() && resetToken.getExpiryDate().after(new Date()))
                .orElse(false);
    }

    @Transactional
    public void markTokenAsUsed(String token) {
        passwordResetTokenRepository.findByToken(token).ifPresent(resetToken -> {
            resetToken.setUsed(true);
            passwordResetTokenRepository.save(resetToken);
        });
    }

    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupExpiredTokens() {
        passwordResetTokenRepository.deleteExpiredTokens(new Date());
    }

    /// Este unicamente se manda a llamar cuando un usuario crea un grupo
    @Transactional
    public boolean updateRole(Long idUser) {
        Optional<Users> searchUser = usersRepository.findById(idUser);
        if(searchUser.isPresent()) {
            Users user = searchUser.get();
            Role role = user.getRole();
            role.setIdRole(1L);
            role.setName("ADMIN_GRUPAL");
            user.setRole(role);
            usersRepository.save(user);
            return true;
        }
        return false;
    }

    public String getUserLogin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        return userDetails.getUsername();
    }

    @Transactional
    public ResponseEntity<ApiResponse> updateUserPassword(Long id, String currentPassword, String newPassword) {
        Optional<Users> userOpt = usersRepository.findById(id);

        if (userOpt.isEmpty()) {
            return new ResponseEntity<>(new ApiResponse(USER_NOT_FOUND_MESSAGE, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        Users user = userOpt.get();

        // Verificar la contraseña actual
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return new ResponseEntity<>(new ApiResponse("Contraseña actual incorrecta", HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
        }

        // Actualizar con la nueva contraseña
        user.setPassword(passwordEncoder.encode(newPassword));
        usersRepository.save(user);

        return new ResponseEntity<>(new ApiResponse("Contraseña actualizada exitosamente", HttpStatus.OK), HttpStatus.OK);
    }
}