package utez.edu.mx.tdsw.models.assignment;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.deliveryperson.DeliveryPerson;
import utez.edu.mx.tdsw.models.deliveryperson.DeliveryPersonRepository;
import utez.edu.mx.tdsw.models.notification.NotificationDTO;
import utez.edu.mx.tdsw.models.notification.NotificationService;
import utez.edu.mx.tdsw.models.store.Store;
import utez.edu.mx.tdsw.models.store.StoreRepository;
import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.models.user.UsersRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AssignmentService {

    private static final String ASSIGNMENT_NOT_FOUND = "Asignación no encontrada";

    private final AssignmentRepository assignmentRepository;
    private final NotificationService notificationService;
    private final UsersRepository usersRepository;
    private final DeliveryPersonRepository deliveryPersonRepository;
    private final StoreRepository storeRepository;

    public AssignmentService(AssignmentRepository assignmentRepository,
                           NotificationService notificationService,
                           UsersRepository usersRepository,
                           DeliveryPersonRepository deliveryPersonRepository,
                           StoreRepository storeRepository) {
        this.assignmentRepository = assignmentRepository;
        this.notificationService = notificationService;
        this.usersRepository = usersRepository;
        this.deliveryPersonRepository = deliveryPersonRepository;
        this.storeRepository = storeRepository;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getAll() {
        List<Assignment> assignments = assignmentRepository.findAll();
        return new ResponseEntity<>(new ApiResponse(assignments, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getById(Long id) {
        return assignmentRepository.findById(id)
                .map(assignment -> new ResponseEntity<>(new ApiResponse(assignment, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(ASSIGNMENT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getByDeliveryPerson(Long deliveryPersonId) {
        List<Assignment> assignments = assignmentRepository.findByDeliveryPersonIdDeliveryPerson(deliveryPersonId);
        return new ResponseEntity<>(new ApiResponse(assignments, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getByStore(Long storeId) {
        List<Assignment> assignments = assignmentRepository.findByStoreIdStore(storeId);
        return new ResponseEntity<>(new ApiResponse(assignments, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getActiveAssignments(Long deliveryPersonId) {
        LocalDate today = LocalDate.now();
        List<Assignment> assignments = assignmentRepository.findActiveAssignmentsByDeliveryPersonAndDate(deliveryPersonId, today);
        return new ResponseEntity<>(new ApiResponse(assignments, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getByDeliveryPersonAndDateRange(Long deliveryPersonId, LocalDate startDate, LocalDate endDate) {
        List<Assignment> assignments = assignmentRepository.findByDeliveryPersonAndDateRange(deliveryPersonId, startDate, endDate);
        return new ResponseEntity<>(new ApiResponse(assignments, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getVisitedAssignments(Long deliveryPersonId, Boolean visited) {
        List<Assignment> assignments = assignmentRepository.findByDeliveryPersonIdDeliveryPersonAndVisited(deliveryPersonId, visited);
        return new ResponseEntity<>(new ApiResponse(assignments, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> create(Assignment assignment) {
        try {
            // Log para debug
            System.out.println("================== CREATE ASSIGNMENT ==================");
            System.out.println("Received DeliveryPerson: " + (assignment.getDeliveryPerson() != null ? assignment.getDeliveryPerson().getIdDeliveryPerson() : "NULL"));
            System.out.println("Received Store: " + (assignment.getStore() != null ? assignment.getStore().getIdStore() : "NULL"));

            // Validar que las fechas sean válidas
            if (assignment.getStartDate().isAfter(assignment.getEndDate())) {
                return new ResponseEntity<>(
                    new ApiResponse("La fecha de inicio no puede ser posterior a la fecha de fin", HttpStatus.BAD_REQUEST),
                    HttpStatus.BAD_REQUEST
                );
            }

            // Verificar si ya existe una asignación activa para este repartidor y tienda en el rango de fechas
            boolean exists = assignmentRepository.existsActiveAssignmentForDeliveryPersonAndStore(
                assignment.getDeliveryPerson().getIdDeliveryPerson(),
                assignment.getStore().getIdStore(),
                assignment.getStartDate(),
                assignment.getEndDate()
            );

            if (exists) {
                return new ResponseEntity<>(
                    new ApiResponse("El repartidor ya tiene asignada esta tienda en el período seleccionado", HttpStatus.BAD_REQUEST),
                    HttpStatus.BAD_REQUEST
                );
            }

            // Verificar si la tienda ya tiene otro repartidor asignado en las fechas seleccionadas
            List<Assignment> activeStoreAssignments = assignmentRepository.findActiveAssignmentsByStoreAndDate(
                assignment.getStore().getIdStore(),
                assignment.getStartDate()
            );

            // Filtrar asignaciones que se superpongan con el nuevo período
            for (Assignment existing : activeStoreAssignments) {
                if (!(assignment.getEndDate().isBefore(existing.getStartDate()) ||
                      assignment.getStartDate().isAfter(existing.getEndDate()))) {
                    // Si hay superposición, desactivar la asignación anterior
                    existing.setStatus(false);
                    assignmentRepository.save(existing);
                }
            }

            Assignment savedAssignment = assignmentRepository.save(assignment);

            // Cargar los objetos completos de DeliveryPerson y Store para la notificación
            Long deliveryPersonId = savedAssignment.getDeliveryPerson().getIdDeliveryPerson();
            Long storeId = savedAssignment.getStore().getIdStore();

            Optional<DeliveryPerson> deliveryPersonOpt = deliveryPersonRepository.findById(deliveryPersonId);
            Optional<Store> storeOpt = storeRepository.findById(storeId);

            if (deliveryPersonOpt.isPresent() && storeOpt.isPresent()) {
                DeliveryPerson deliveryPerson = deliveryPersonOpt.get();
                Store store = storeOpt.get();

                System.out.println("========================================");
                System.out.println("ASSIGNMENT CREATED - SENDING NOTIFICATION");
                System.out.println("Delivery Person: " + deliveryPerson.getEmail());
                System.out.println("Store: " + store.getName());
                System.out.println("========================================");

                // Crear un objeto temporal con los datos completos para la notificación
                savedAssignment.setDeliveryPerson(deliveryPerson);
                savedAssignment.setStore(store);
                sendStoreAssignedNotification(savedAssignment);
            } else {
                System.err.println("ERROR: No se pudieron cargar DeliveryPerson o Store para la notificación");
            }

            return new ResponseEntity<>(new ApiResponse(savedAssignment, HttpStatus.CREATED), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(
                new ApiResponse("Error al crear asignación: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> update(Long id, Assignment assignment) {
        if (!assignmentRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(ASSIGNMENT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        assignment.setIdAssignment(id);
        Assignment updatedAssignment = assignmentRepository.save(assignment);
        return new ResponseEntity<>(new ApiResponse(updatedAssignment, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> markVisited(Long id) {
        return assignmentRepository.findById(id)
                .map(assignment -> {
                    assignment.setVisited(true);
                    assignment.setVisitDate(LocalDateTime.now());
                    Assignment updatedAssignment = assignmentRepository.save(assignment);
                    return new ResponseEntity<>(new ApiResponse(updatedAssignment, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(ASSIGNMENT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ResponseEntity<ApiResponse> delete(Long id) {
        if (!assignmentRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(ASSIGNMENT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        assignmentRepository.deleteById(id);
        return new ResponseEntity<>(new ApiResponse("Asignación eliminada exitosamente", HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> changeStatus(Long id) {
        return assignmentRepository.findById(id)
                .map(assignment -> {
                    assignment.setStatus(!assignment.getStatus());
                    Assignment updatedAssignment = assignmentRepository.save(assignment);
                    return new ResponseEntity<>(new ApiResponse(updatedAssignment, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(ASSIGNMENT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    /**
     * Enviar notificación al repartidor cuando se le asigna una tienda
     */
    private void sendStoreAssignedNotification(Assignment assignment) {
        try {
            // Verificar que las relaciones estén cargadas
            if (assignment.getDeliveryPerson() == null) {
                System.err.println("ERROR: DeliveryPerson es null en la asignación");
                return;
            }

            if (assignment.getStore() == null) {
                System.err.println("ERROR: Store es null en la asignación");
                return;
            }

            // Buscar al usuario del repartidor por email
            String deliveryPersonEmail = assignment.getDeliveryPerson().getEmail();

            if (deliveryPersonEmail == null) {
                System.err.println("ERROR: Email del repartidor es null");
                return;
            }

            Optional<Users> userOpt = usersRepository.findByEmail(deliveryPersonEmail);

            if (userOpt.isEmpty()) {
                System.err.println("No se encontró usuario para el repartidor con email: " + deliveryPersonEmail);
                return;
            }

            Users deliveryUser = userOpt.get();

            // Formatear fechas
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String startDateStr = assignment.getStartDate().format(formatter);
            String endDateStr = assignment.getEndDate().format(formatter);

            // Crear la notificación
            NotificationDTO notificationDTO = new NotificationDTO();
            notificationDTO.setUserId(deliveryUser.getIdUser());
            notificationDTO.setTitle("Nueva Tienda Asignada");
            notificationDTO.setMessage(String.format(
                "Se te ha asignado la tienda '%s' del %s al %s",
                assignment.getStore().getName(),
                startDateStr,
                endDateStr
            ));
            notificationDTO.setType("STORE_ASSIGNED");
            notificationDTO.setRelatedStoreId(assignment.getStore().getIdStore());

            notificationService.createNotification(notificationDTO);
            System.out.println("Notificación enviada al repartidor: " + deliveryUser.getEmail());

        } catch (Exception e) {
            System.err.println("Error al enviar notificación de asignación: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
