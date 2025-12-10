package utez.edu.mx.tdsw.models.group.membership;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@Entity
@Table(name = "membership")
public class GroupMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @Column(name = "id_group")
    private Long idGroup;

    @Column(name = "group_name", nullable = false, length = 100)
    private String groupName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private MembershipRole role = MembershipRole.MIEMBRO;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "join_date", nullable = false)
    private Date joinDate;

    @Column(name = "status", nullable = false)
    private Boolean status = true;

    public enum MembershipRole {
        ADMIN, MIEMBRO
    }
}
