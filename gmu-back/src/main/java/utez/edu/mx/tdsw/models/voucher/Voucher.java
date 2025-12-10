package utez.edu.mx.tdsw.models.voucher;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "comprobantes")
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_member")
    private Long idMember;

    @Column(name = "id_group")
    private Long idGroup;

    @Column(name = "image_type")
    private String imageType;

    @Lob
    @Column(name = "image_data", columnDefinition = "LONGBLOB")
    private byte[] imageData;
}
