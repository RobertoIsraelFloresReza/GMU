package utez.edu.mx.tdsw.models.order;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class OrderDTO {
    private String notes;
    private Double latitude;
    private Double longitude;
    private List<OrderItemDTO> items;
}
