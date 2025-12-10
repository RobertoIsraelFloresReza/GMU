package utez.edu.mx.tdsw.models.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupsRepository extends JpaRepository<Groups, Long> {
    Optional<Groups> findById(Long id);
    Optional<Groups> findByCode(String code);
}
