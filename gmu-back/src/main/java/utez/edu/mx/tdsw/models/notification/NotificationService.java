package utez.edu.mx.tdsw.models.notification;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.order.Order;
import utez.edu.mx.tdsw.models.order.OrderRepository;
import utez.edu.mx.tdsw.models.store.Store;
import utez.edu.mx.tdsw.models.store.StoreRepository;
import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.models.user.UsersRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UsersRepository usersRepository;
    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UsersRepository usersRepository,
                               OrderRepository orderRepository,
                               StoreRepository storeRepository) {
        this.notificationRepository = notificationRepository;
        this.usersRepository = usersRepository;
        this.orderRepository = orderRepository;
        this.storeRepository = storeRepository;
    }

    @Transactional
    public ResponseEntity<ApiResponse> createNotification(NotificationDTO dto) {
        try {
            Optional<Users> userOpt = usersRepository.findById(dto.getUserId());
            if (userOpt.isEmpty()) {
                return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.NOT_FOUND, true, "Usuario no encontrado"),
                    HttpStatus.NOT_FOUND
                );
            }

            Notification notification = new Notification();
            notification.setUser(userOpt.get());
            notification.setTitle(dto.getTitle());
            notification.setMessage(dto.getMessage());
            notification.setType(Notification.NotificationType.valueOf(dto.getType()));
            notification.setIsRead(false);

            if (dto.getRelatedOrderId() != null) {
                orderRepository.findById(dto.getRelatedOrderId())
                    .ifPresent(notification::setRelatedOrder);
            }

            if (dto.getRelatedStoreId() != null) {
                storeRepository.findById(dto.getRelatedStoreId())
                    .ifPresent(notification::setRelatedStore);
            }

            notification = notificationRepository.save(notification);
            return new ResponseEntity<>(new ApiResponse(notification, HttpStatus.CREATED), HttpStatus.CREATED);

        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al crear notificación"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getUserNotifications(Long userId) {
        try {
            List<Notification> notifications = notificationRepository.findByUser_IdUserOrderByCreatedAtDesc(userId);
            return new ResponseEntity<>(new ApiResponse(notifications, HttpStatus.OK), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al obtener notificaciones"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getUnreadNotifications(Long userId) {
        try {
            List<Notification> notifications = notificationRepository.findByUser_IdUserAndIsReadFalseOrderByCreatedAtDesc(userId);
            return new ResponseEntity<>(new ApiResponse(notifications, HttpStatus.OK), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al obtener notificaciones no leídas"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getUnreadCount(Long userId) {
        try {
            Long count = notificationRepository.countByUser_IdUserAndIsReadFalse(userId);
            return new ResponseEntity<>(new ApiResponse(count, HttpStatus.OK), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al contar notificaciones"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> markAsRead(Long notificationId) {
        try {
            Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
            if (notificationOpt.isEmpty()) {
                return new ResponseEntity<>(
                    new ApiResponse(HttpStatus.NOT_FOUND, true, "Notificación no encontrada"),
                    HttpStatus.NOT_FOUND
                );
            }

            Notification notification = notificationOpt.get();
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);

            return new ResponseEntity<>(new ApiResponse(notification, HttpStatus.OK), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al marcar como leída"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> markAllAsRead(Long userId) {
        try {
            List<Notification> unreadNotifications = notificationRepository.findByUser_IdUserAndIsReadFalseOrderByCreatedAtDesc(userId);
            LocalDateTime now = LocalDateTime.now();

            for (Notification notification : unreadNotifications) {
                notification.setIsRead(true);
                notification.setReadAt(now);
            }

            notificationRepository.saveAll(unreadNotifications);

            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.OK, false, "Todas las notificaciones marcadas como leídas"),
                HttpStatus.OK
            );
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                new ApiResponse(HttpStatus.INTERNAL_SERVER_ERROR, true, "Error al marcar todas como leídas"),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
