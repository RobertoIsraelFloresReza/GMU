package utez.edu.mx.tdsw.models.group.member;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import utez.edu.mx.tdsw.models.group.Groups;

import java.math.BigDecimal;
import java.util.Date;

@Data
@NoArgsConstructor
@Entity
@Table(name = "member")
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_user", nullable = false)
    private Long idUser;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private MemberRole role = MemberRole.MIEMBRO;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "join_date", nullable = false)
    private Date joinDate;

    @Column(name = "status", nullable = false)
    private Boolean status = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_group", nullable = false)
    private Groups group;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "paid", nullable = false)
    private Boolean paid = true;

    @Column(name = "percentage", nullable = false, precision = 10, scale = 2)
    private BigDecimal percentage = BigDecimal.ZERO;

    public enum MemberRole {
        ADMIN, MIEMBRO
    }
}
