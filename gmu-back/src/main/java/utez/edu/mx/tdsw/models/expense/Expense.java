package utez.edu.mx.tdsw.models.expense;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import utez.edu.mx.tdsw.models.category.Category;
import utez.edu.mx.tdsw.models.group.Groups;

import java.math.BigDecimal;
import java.util.Date;

@Data
@NoArgsConstructor
@Entity
@Table(name = "expense")
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "idUser", nullable = false)
    private Long idUser;

    @Column(name = "created_by", length = 100)
    private String createBy;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idCategory", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idGroup", nullable = false)
    private Groups group;

    @Column(nullable = false)
    private Date date = new Date();

    @Column(nullable = false)
    private Date limitDate = new Date();

    @Column(name = "status_paid", nullable = false)
    private Boolean statusPaid  = false;

    public Expense(Groups group, Long idUser, BigDecimal amount, String description,
                   Category category, String createBy, Date date, Date limitDate, Boolean statusPaid ) {
        this.group = group;
        this.idUser = idUser;
        this.amount = amount;
        this.description = description;
        this.category = category;
        this.createBy = createBy;
        this.date = date;
        this.limitDate = limitDate;
        this.statusPaid  = statusPaid ;
    }
}
