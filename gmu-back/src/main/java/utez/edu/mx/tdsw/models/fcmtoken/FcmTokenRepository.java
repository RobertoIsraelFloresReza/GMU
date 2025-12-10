package utez.edu.mx.tdsw.models.fcmtoken;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utez.edu.mx.tdsw.models.user.Users;

import java.util.List;
import java.util.Optional;

@Repository
public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {

    List<FcmToken> findByUserAndIsActiveTrue(Users user);

    List<FcmToken> findByIsActiveTrue();

    Optional<FcmToken> findByToken(String token);

    List<FcmToken> findByUser_IdUser(Long userId);

    void deleteByToken(String token);
}
