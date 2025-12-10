package utez.edu.mx.tdsw.models.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utez.edu.mx.tdsw.models.user.Users;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser_IdUserOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUser_IdUserAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    Long countByUser_IdUserAndIsReadFalse(Long userId);

    List<Notification> findTop10ByUser_IdUserOrderByCreatedAtDesc(Long userId);
}
