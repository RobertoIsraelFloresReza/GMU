package utez.edu.mx.tdsw.models.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByDeliveryPersonIdDeliveryPerson(Long deliveryPersonId);

    List<Assignment> findByStoreIdStore(Long storeId);

    @Query("SELECT a FROM Assignment a WHERE a.deliveryPerson.idDeliveryPerson = :deliveryPersonId " +
            "AND :date BETWEEN a.startDate AND a.endDate AND a.status = true")
    List<Assignment> findActiveAssignmentsByDeliveryPersonAndDate(
            @Param("deliveryPersonId") Long deliveryPersonId,
            @Param("date") LocalDate date
    );

    @Query("SELECT a FROM Assignment a WHERE a.deliveryPerson.idDeliveryPerson = :deliveryPersonId " +
            "AND a.startDate <= :endDate AND a.endDate >= :startDate AND a.status = true")
    List<Assignment> findByDeliveryPersonAndDateRange(
            @Param("deliveryPersonId") Long deliveryPersonId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    List<Assignment> findByDeliveryPersonIdDeliveryPersonAndVisited(Long deliveryPersonId, Boolean visited);

    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.deliveryPerson.idDeliveryPerson = :deliveryPersonId " +
            "AND :date BETWEEN a.startDate AND a.endDate AND a.visited = true AND a.status = true")
    long countVisitedByDeliveryPersonAndDate(
            @Param("deliveryPersonId") Long deliveryPersonId,
            @Param("date") LocalDate date
    );

    // Buscar asignación activa para una tienda específica
    @Query("SELECT a FROM Assignment a WHERE a.store.idStore = :storeId " +
            "AND a.status = true AND :date BETWEEN a.startDate AND a.endDate")
    List<Assignment> findActiveAssignmentsByStoreAndDate(
            @Param("storeId") Long storeId,
            @Param("date") LocalDate date
    );

    // Verificar si un repartidor ya tiene asignada una tienda en un rango de fechas
    @Query("SELECT COUNT(a) > 0 FROM Assignment a WHERE a.deliveryPerson.idDeliveryPerson = :deliveryPersonId " +
            "AND a.store.idStore = :storeId " +
            "AND a.status = true " +
            "AND (a.startDate <= :endDate AND a.endDate >= :startDate)")
    boolean existsActiveAssignmentForDeliveryPersonAndStore(
            @Param("deliveryPersonId") Long deliveryPersonId,
            @Param("storeId") Long storeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
