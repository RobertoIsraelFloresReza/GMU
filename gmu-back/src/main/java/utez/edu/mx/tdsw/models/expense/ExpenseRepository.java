package utez.edu.mx.tdsw.models.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import utez.edu.mx.tdsw.models.group.Groups;

import java.util.Date;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    @Query("SELECT e FROM Expense e JOIN FETCH e.category WHERE e.group.idGroup = :grupoId ORDER BY e.date DESC")
    List<Expense> findByGroupIdOrderByDateDesc(@Param("grupoId") Long grupoId);

    @Query("SELECT e FROM Expense e JOIN FETCH e.category WHERE e.group.idGroup = :grupoId ORDER BY e.id DESC")
    List<Expense> findByGroupIdOrder(@Param("grupoId") Long grupoId);

    //List<Expense> findByGroupNameOrderByDateDesc(String groupName);

    //List<Expense> findByGroup_IdGroupOrderByDateDesc(Long idGroup);

    List<Expense> findByIdUserOrderByDateDesc(Long idUser);

    List<Expense> findByGroup(Groups group);

    List<Expense> findByGroup_IdGroupAndDateBetween(Long groupId, Date inicio, Date fin);

    void deleteAllByGroup(Groups group);


    //@Query("SELECT e FROM Expense e JOIN FETCH e.category WHERE e.idUser = :usuarioId ORDER BY e.date DESC")
    //List<Expense> findByUsuarioIdOrderByFechaDesc(@Param("usuarioId") Long usuarioId);
}
