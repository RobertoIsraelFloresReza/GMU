package utez.edu.mx.tdsw.models.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderIdOrder(Long orderId);

    void deleteByOrderIdOrder(Long orderId);
}
