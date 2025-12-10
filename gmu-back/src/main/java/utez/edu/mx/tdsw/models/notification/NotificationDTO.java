package utez.edu.mx.tdsw.models.notification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long userId;
    private String title;
    private String message;
    private String type; // ORDER_CREATED, STORE_ASSIGNED, etc.
    private Long relatedOrderId;
    private Long relatedStoreId;
}
