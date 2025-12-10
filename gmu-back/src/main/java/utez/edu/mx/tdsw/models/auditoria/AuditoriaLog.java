package utez.edu.mx.tdsw.models.auditoria;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Table(name = "auditoria_log")
@Data
@NoArgsConstructor
@Entity
@AllArgsConstructor
public class AuditoriaLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String usuario;
    private String accion;
    private String modulo;
    @Column(columnDefinition = "TEXT")
    private String detalles;
    private String ip;
    private LocalDateTime fecha;

    @PrePersist
    public void prePersist() {
        this.fecha = LocalDateTime.now();
    }
}