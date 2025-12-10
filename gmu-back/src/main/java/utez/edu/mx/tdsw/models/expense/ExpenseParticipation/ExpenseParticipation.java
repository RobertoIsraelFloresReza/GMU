package utez.edu.mx.tdsw.models.expense.ExpenseParticipation;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import utez.edu.mx.tdsw.models.expense.Expense;
import utez.edu.mx.tdsw.models.group.member.Member;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@ToString(exclude = {"gasto", "member"})
@Entity
@Table(name = "participaciones_gasto")
@AllArgsConstructor
public class ExpenseParticipation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gasto_id", nullable = false)
    private Long gastoId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "usuario_id", nullable = false)
    private Long idUser;

    @Column(name = "usuario_email", nullable = false, length = 100)
    private String emailUser;

    @Column(name = "usuario_nombre", nullable = false, length = 100)
    private String nameUser;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "pagado", nullable = false)
    private Boolean paid = false;

    // Relación con Expense
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gasto_id", insertable = false, updatable = false)
    @JsonIgnore
    private Expense gasto;

    // Relación con Member
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", insertable = false, updatable = false)
    @JsonIgnore
    private Member member;

    public ExpenseParticipation(Long gastoId, Long idUser, String emailUser, String nameUser, BigDecimal amount, boolean paid) {
        this.gastoId = gastoId;
        this.idUser = idUser;
        this.emailUser = emailUser;
        this.nameUser = nameUser;
        this.amount = amount;
        this.paid = paid;
    }

    public ExpenseParticipation(Expense expense, Member member, BigDecimal amount, boolean paid) {
        this.gastoId = expense.getId();
        this.memberId = member.getId();
        this.idUser = member.getIdUser();
        this.emailUser = member.getEmail();
        this.nameUser = member.getName();
        this.amount = amount;
        this.paid = paid;
        this.gasto = expense;
        this.member = member;
    }


}
