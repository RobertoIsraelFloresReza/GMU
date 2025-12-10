package utez.edu.mx.tdsw.models.store;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import utez.edu.mx.tdsw.models.assignment.Assignment;
import utez.edu.mx.tdsw.models.order.Order;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "stores")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_store")
    private Long idStore;

    @NotBlank(message = "El nombre de la tienda es obligatorio")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotBlank(message = "La dirección es obligatoria")
    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "qr_code", unique = true, length = 50)
    private String qrCode;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "contact_name", length = 100)
    private String contactName;

    @Column(name = "status", nullable = false)
    private Boolean status = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders;

    @JsonIgnore
    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Assignment> assignments;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.status = true;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
