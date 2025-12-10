package utez.edu.mx.tdsw.models.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByDeliveryPersonIdDeliveryPerson(Long deliveryPersonId);

    List<Order> findByStoreIdStore(Long storeId);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByDeliveryPersonIdDeliveryPersonAndStatus(Long deliveryPersonId, OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.deliveryPerson.idDeliveryPerson = :deliveryPersonId " +
            "AND o.orderDate BETWEEN :startDate AND :endDate")
    List<Order> findByDeliveryPersonAndDateRange(
            @Param("deliveryPersonId") Long deliveryPersonId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT o FROM Order o WHERE o.store.idStore = :storeId " +
            "AND o.orderDate BETWEEN :startDate AND :endDate")
    List<Order> findByStoreAndDateRange(
            @Param("storeId") Long storeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    List<Order> findBySyncedFalse();
}
