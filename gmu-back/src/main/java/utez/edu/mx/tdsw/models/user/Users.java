package utez.edu.mx.tdsw.models.user;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import utez.edu.mx.tdsw.models.person.Persons;
import utez.edu.mx.tdsw.models.role.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUser;
    @Column(length = 45, nullable = false, unique = true)
    private String email;
    @Column(length = 150, nullable = false)
    private String password;
    @Column(columnDefinition = "BOOL DEFAULT true")
    private Boolean status;

    public Users(Long idUser, String email, String password, Boolean status) {
        this.idUser = idUser;
        this.email = email;
        this.password = password;
        this.status = status;
    }

    @ManyToOne
    @JoinColumn(name = "idRole", nullable = true)
    @JsonIgnoreProperties(value = {"users"})
    private Role role;

    @OneToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "idPerson", nullable = true)
    private Persons persons;

    public Users(String email, String password, Boolean status, Persons persons) {
        this.email = email;
        this.password = password;
        this.status = status;
        this.persons = persons;
    }

    public Users(String email, String password, Boolean status) {
        this.email = email;
        this.password = password;
        this.status = status;
    }

}
