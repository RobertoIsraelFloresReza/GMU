package utez.edu.mx.tdsw.models.group;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@Entity
@Table(name = "grupos")
public class Groups {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idGroup;
    @Column
    private String name;
    @Column
    private String description;
    @Column(unique = true, length = 6)
    private String code;
    @Column
    private Date date;
    @Column
    private Long idAdmin;

    @Column(nullable = false)
    private Boolean usePercentage = false;
}
