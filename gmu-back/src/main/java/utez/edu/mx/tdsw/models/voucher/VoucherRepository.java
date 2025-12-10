package utez.edu.mx.tdsw.models.voucher;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findById(Long id);

    Optional<Voucher> findByIdMemberAndIdGroup(Long idMember, Long idGroup);
}
