package utez.edu.mx.tdsw.models.person;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface PersonsRepository extends JpaRepository<Persons,Long> {
    Optional<Persons> findById(Long idAdmin);
    Optional<Persons> findByEmail(String email);
    Optional<Persons> findByPhone(String phone);
}
