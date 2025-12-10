package utez.edu.mx.tdsw.models.deliveryperson;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.role.Role;
import utez.edu.mx.tdsw.models.role.RoleRepository;
import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.models.user.UsersRepository;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DeliveryPersonService {

    private static final String DELIVERY_PERSON_NOT_FOUND = "Repartidor no encontrado";
    private static final String EMAIL_EXISTS = "El correo electrónico ya está registrado";
    private static final String ROLE_NOT_FOUND = "Rol no encontrado";

    private final DeliveryPersonRepository deliveryPersonRepository;
    private final RoleRepository roleRepository;
    private final UsersRepository usersRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public DeliveryPersonService(DeliveryPersonRepository deliveryPersonRepository,
                                  RoleRepository roleRepository,
                                  UsersRepository usersRepository) {
        this.deliveryPersonRepository = deliveryPersonRepository;
        this.roleRepository = roleRepository;
        this.usersRepository = usersRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getAll() {
        List<DeliveryPerson> deliveryPersons = deliveryPersonRepository.findAll();
        return new ResponseEntity<>(new ApiResponse(deliveryPersons, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getById(Long id) {
        return deliveryPersonRepository.findById(id)
                .map(deliveryPerson -> new ResponseEntity<>(new ApiResponse(deliveryPerson, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(DELIVERY_PERSON_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getByEmail(String email) {
        return deliveryPersonRepository.findByEmail(email)
                .map(deliveryPerson -> new ResponseEntity<>(new ApiResponse(deliveryPerson, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(DELIVERY_PERSON_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getActiveDeliveryPersons() {
        List<DeliveryPerson> deliveryPersons = deliveryPersonRepository.findByStatus(true);
        return new ResponseEntity<>(new ApiResponse(deliveryPersons, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> create(DeliveryPerson deliveryPerson) {
        try {
            // Validar que el email no exista en delivery_persons
            if (deliveryPersonRepository.existsByEmail(deliveryPerson.getEmail())) {
                return new ResponseEntity<>(new ApiResponse(EMAIL_EXISTS + " en repartidores", HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
            }

            // Validar que el email no exista en users
            if (usersRepository.existsByEmail(deliveryPerson.getEmail())) {
                return new ResponseEntity<>(new ApiResponse(EMAIL_EXISTS + " en usuarios", HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
            }

            // Obtener rol DELIVERY_PERSON
            Optional<Role> deliveryRole = roleRepository.findByName("DELIVERY_PERSON");
            if (deliveryRole.isEmpty()) {
                return new ResponseEntity<>(new ApiResponse(ROLE_NOT_FOUND, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
            }

            // Guardar contraseña sin encriptar temporalmente para crear el usuario
            String plainPassword = deliveryPerson.getPassword();

            // Encriptar la contraseña para delivery_person
            deliveryPerson.setPassword(passwordEncoder.encode(plainPassword));
            deliveryPerson.setRole(deliveryRole.get());

            // 1. Guardar en delivery_persons
            DeliveryPerson savedDeliveryPerson = deliveryPersonRepository.save(deliveryPerson);
            System.out.println("✅ DeliveryPerson guardado: " + savedDeliveryPerson.getEmail());

            // 2. Crear usuario en la tabla users para que pueda hacer login
            Users user = new Users();
            user.setEmail(deliveryPerson.getEmail());
            user.setPassword(passwordEncoder.encode(plainPassword)); // Misma contraseña encriptada
            user.setStatus(true);
            user.setRole(deliveryRole.get());

            usersRepository.save(user);
            System.out.println("✅ Usuario creado en tabla users: " + user.getEmail());

            return new ResponseEntity<>(new ApiResponse(savedDeliveryPerson, HttpStatus.CREATED), HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("❌ Error al crear repartidor: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(new ApiResponse("Error al crear repartidor: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> update(Long id, DeliveryPerson deliveryPerson) {
        if (!deliveryPersonRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(DELIVERY_PERSON_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        // Validar email único (excepto el actual)
        deliveryPersonRepository.findByEmail(deliveryPerson.getEmail()).ifPresent(existingPerson -> {
            if (!existingPerson.getIdDeliveryPerson().equals(id)) {
                throw new IllegalArgumentException(EMAIL_EXISTS);
            }
        });

        // Obtener el delivery person actual para saber el email original
        DeliveryPerson existingDeliveryPerson = deliveryPersonRepository.findById(id).orElse(null);
        if (existingDeliveryPerson == null) {
            return new ResponseEntity<>(new ApiResponse(DELIVERY_PERSON_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        String newPassword = null;
        // Si se proporciona una nueva contraseña, encriptarla
        if (deliveryPerson.getPassword() != null && !deliveryPerson.getPassword().isEmpty()) {
            newPassword = passwordEncoder.encode(deliveryPerson.getPassword());
            deliveryPerson.setPassword(newPassword);
        } else {
            // Mantener la contraseña actual
            deliveryPerson.setPassword(existingDeliveryPerson.getPassword());
        }

        deliveryPerson.setIdDeliveryPerson(id);
        DeliveryPerson updatedDeliveryPerson = deliveryPersonRepository.save(deliveryPerson);

        // Actualizar también en la tabla users
        try {
            Optional<Users> userOpt = usersRepository.findByEmail(existingDeliveryPerson.getEmail());
            if (userOpt.isPresent()) {
                Users user = userOpt.get();

                // Si el email cambió, actualizar el email
                if (!existingDeliveryPerson.getEmail().equals(deliveryPerson.getEmail())) {
                    user.setEmail(deliveryPerson.getEmail());
                }

                // Si hay nueva contraseña, actualizar
                if (newPassword != null) {
                    user.setPassword(newPassword);
                }

                usersRepository.save(user);
                System.out.println("✅ Usuario actualizado en tabla users: " + user.getEmail());
            } else {
                System.out.println("⚠️ No se encontró usuario en tabla users para: " + existingDeliveryPerson.getEmail());
            }
        } catch (Exception e) {
            System.err.println("❌ Error al actualizar usuario en tabla users: " + e.getMessage());
            // No lanzamos excepción para no fallar la actualización del delivery person
        }

        return new ResponseEntity<>(new ApiResponse(updatedDeliveryPerson, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> delete(Long id) {
        if (!deliveryPersonRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(DELIVERY_PERSON_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        // Obtener el email del delivery person antes de eliminarlo
        Optional<DeliveryPerson> deliveryPersonOpt = deliveryPersonRepository.findById(id);
        if (deliveryPersonOpt.isPresent()) {
            String email = deliveryPersonOpt.get().getEmail();

            // Eliminar de delivery_persons
            deliveryPersonRepository.deleteById(id);
            System.out.println("✅ DeliveryPerson eliminado: " + email);

            // Eliminar también de users
            try {
                Optional<Users> userOpt = usersRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    usersRepository.delete(userOpt.get());
                    System.out.println("✅ Usuario eliminado de tabla users: " + email);
                } else {
                    System.out.println("⚠️ No se encontró usuario en tabla users para: " + email);
                }
            } catch (Exception e) {
                System.err.println("❌ Error al eliminar usuario de tabla users: " + e.getMessage());
                // No lanzamos excepción para no fallar la eliminación del delivery person
            }
        }

        return new ResponseEntity<>(new ApiResponse("Repartidor eliminado exitosamente", HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> changeStatus(Long id) {
        return deliveryPersonRepository.findById(id)
                .map(deliveryPerson -> {
                    boolean newStatus = !deliveryPerson.getStatus();
                    deliveryPerson.setStatus(newStatus);
                    DeliveryPerson updatedDeliveryPerson = deliveryPersonRepository.save(deliveryPerson);

                    // Actualizar también el estado en users
                    try {
                        Optional<Users> userOpt = usersRepository.findByEmail(deliveryPerson.getEmail());
                        if (userOpt.isPresent()) {
                            Users user = userOpt.get();
                            user.setStatus(newStatus);
                            usersRepository.save(user);
                            System.out.println("✅ Estado de usuario actualizado en tabla users: " + user.getEmail() + " -> " + newStatus);
                        } else {
                            System.out.println("⚠️ No se encontró usuario en tabla users para: " + deliveryPerson.getEmail());
                        }
                    } catch (Exception e) {
                        System.err.println("❌ Error al actualizar estado de usuario en tabla users: " + e.getMessage());
                    }

                    return new ResponseEntity<>(new ApiResponse(updatedDeliveryPerson, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(DELIVERY_PERSON_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ResponseEntity<ApiResponse> updatePassword(Long id, String currentPassword, String newPassword) {
        Optional<DeliveryPerson> deliveryPersonOpt = deliveryPersonRepository.findById(id);

        if (deliveryPersonOpt.isEmpty()) {
            return new ResponseEntity<>(new ApiResponse(DELIVERY_PERSON_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        DeliveryPerson deliveryPerson = deliveryPersonOpt.get();

        // Verificar la contraseña actual
        if (!passwordEncoder.matches(currentPassword, deliveryPerson.getPassword())) {
            return new ResponseEntity<>(new ApiResponse("Contraseña actual incorrecta", HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
        }

        // Actualizar con la nueva contraseña
        String encodedPassword = passwordEncoder.encode(newPassword);
        deliveryPerson.setPassword(encodedPassword);
        deliveryPersonRepository.save(deliveryPerson);

        // Actualizar también la contraseña en users
        try {
            Optional<Users> userOpt = usersRepository.findByEmail(deliveryPerson.getEmail());
            if (userOpt.isPresent()) {
                Users user = userOpt.get();
                user.setPassword(encodedPassword);
                usersRepository.save(user);
                System.out.println("✅ Contraseña actualizada en tabla users: " + user.getEmail());
            } else {
                System.out.println("⚠️ No se encontró usuario en tabla users para: " + deliveryPerson.getEmail());
            }
        } catch (Exception e) {
            System.err.println("❌ Error al actualizar contraseña en tabla users: " + e.getMessage());
        }

        return new ResponseEntity<>(new ApiResponse("Contraseña actualizada exitosamente", HttpStatus.OK), HttpStatus.OK);
    }
}
