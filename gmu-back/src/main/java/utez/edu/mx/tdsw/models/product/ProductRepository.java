package utez.edu.mx.tdsw.models.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByStatus(Boolean status);

    List<Product> findByCategory(String category);

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    List<Product> findByNameContainingIgnoreCase(String name);
}
