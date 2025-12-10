package utez.edu.mx.tdsw.controllers.notification;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.notification.NotificationDTO;
import utez.edu.mx.tdsw.models.notification.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"*"})
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> createNotification(@RequestBody NotificationDTO dto) {
        return notificationService.createNotification(dto);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> getUserNotifications(@PathVariable Long userId) {
        return notificationService.getUserNotifications(userId);
    }

    @GetMapping("/user/{userId}/unread")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> getUnreadNotifications(@PathVariable Long userId) {
        return notificationService.getUnreadNotifications(userId);
    }

    @GetMapping("/user/{userId}/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> getUnreadCount(@PathVariable Long userId) {
        return notificationService.getUnreadCount(userId);
    }

    @PutMapping("/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable Long notificationId) {
        return notificationService.markAsRead(notificationId);
    }

    @PutMapping("/user/{userId}/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse> markAllAsRead(@PathVariable Long userId) {
        return notificationService.markAllAsRead(userId);
    }
}
