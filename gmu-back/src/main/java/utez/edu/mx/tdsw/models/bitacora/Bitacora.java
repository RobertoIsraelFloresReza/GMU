package utez.edu.mx.tdsw.models.bitacora;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@Entity
@Table(name = "bitacora")
public class Bitacora {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idBitacora", nullable = false)
    private Long id;

    @Size(max = 255)
    @NotNull
    @Column(name = "tabla_afectada", nullable = false)
    private String tablaAfectada;

    @Size(max = 10)
    @NotNull
    @Column(name = "operacion", nullable = false, length = 10)
    private String operacion;

    @Column(name = "datos_anteriores")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> datosAnteriores;

    @Column(name = "datos_nuevos")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> datosNuevos;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "fecha_operacion", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private Instant fechaOperacion;

    @Size(max = 255)
    @Column(name = "usuario")
    private String usuario;

}