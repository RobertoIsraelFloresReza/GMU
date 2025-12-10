package utez.edu.mx.tdsw.models.deliveryperson;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryPersonRepository extends JpaRepository<DeliveryPerson, Long> {

    Optional<DeliveryPerson> findByEmail(String email);

    List<DeliveryPerson> findByStatus(Boolean status);

    boolean existsByEmail(String email);
}
