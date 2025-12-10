package utez.edu.mx.tdsw.models.person;

import com.fasterxml.jackson.annotation.JsonIgnore;
import utez.edu.mx.tdsw.models.user.Users;
import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@Entity
@Table(name = "persons")
public class Persons {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPerson;
    @Column(length = 45)
    private String name;
    @Column(length = 45)
    private String lastname;
    @Column(unique = true)
    private String email;
    @Column(unique = true, length = 10)
    private String phone;
    @Column(columnDefinition = "BOOL DEFAULT true")
    private Boolean status;



    @JsonIgnore
    @OneToOne(mappedBy = "persons", cascade = CascadeType.PERSIST)
    private Users usuario;

    public Persons(String name, String lastname, String email, String phone, Boolean status) {
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.phone = phone;
        this.status = status;
    }

    public Persons(Long idPerson, String name, String lastname, String email, String phone, Boolean status) {
        this.idPerson = idPerson;
        this.name = name;
        this.lastname = lastname;
        this.email = email;
        this.phone = phone;
        this.status = status;
    }
}
