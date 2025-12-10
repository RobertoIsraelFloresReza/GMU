package utez.edu.mx.tdsw.models.expense.ExpenseParticipation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ExpenseParticipationRepository extends JpaRepository<ExpenseParticipation, Long> {

    @Query("SELECT ep FROM ExpenseParticipation ep WHERE ep.gastoId = :gastoId")
    List<ExpenseParticipation> findByGastoId(@Param("gastoId") Long gastoId);

    @Query("SELECT ep FROM ExpenseParticipation ep WHERE ep.idUser = :usuarioId")
    List<ExpenseParticipation> findByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT ep FROM ExpenseParticipation ep WHERE ep.idUser = :usuarioId AND ep.paid = false")
    List<ExpenseParticipation> findByUsuarioIdAndPagadoFalse(@Param("usuarioId") Long usuarioId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ExpenseParticipation ep WHERE ep.gastoId IN :ids")
    void deleteAllByExpenseIds(@Param("ids") List<Long> ids);

    void deleteAllByMemberId(Long memberId);
}
