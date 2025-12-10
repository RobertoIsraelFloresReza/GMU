package utez.edu.mx.tdsw.models.notification;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import utez.edu.mx.tdsw.models.order.Order;
import utez.edu.mx.tdsw.models.store.Store;
import utez.edu.mx.tdsw.models.user.Users;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_notification")
    private Long idNotification;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @ManyToOne
    @JoinColumn(name = "related_order_id")
    private Order relatedOrder;

    @ManyToOne
    @JoinColumn(name = "related_store_id")
    private Store relatedStore;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum NotificationType {
        ORDER_CREATED,
        ORDER_UPDATED,
        STORE_ASSIGNED,
        ORDER_COMPLETED,
        ORDER_CANCELLED,
        INFO,
        WARNING
    }
}
