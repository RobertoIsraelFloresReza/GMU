package utez.edu.mx.tdsw.models.store;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {

    Optional<Store> findByQrCode(String qrCode);

    List<Store> findByStatus(Boolean status);

    boolean existsByQrCode(String qrCode);

    boolean existsByNameIgnoreCase(String name);
}
