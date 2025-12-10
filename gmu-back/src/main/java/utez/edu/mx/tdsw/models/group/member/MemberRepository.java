package utez.edu.mx.tdsw.models.group.member;

import org.springframework.data.jpa.repository.JpaRepository;
import utez.edu.mx.tdsw.models.group.Groups;

import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    /// OBTENER MIEMBRO POR
    // ID
    Optional<Member> findById(Long id);

    // EMAIL
    Optional<Member> findByEmail(String email);

    // EMAIL y NOMBRE DE GRUPO
    Optional<Member> findByEmailAndGroupName(String email, String groupName);

    /// OBTENER LISTA DE MIEMBROS POR
    // EMAIL y STATUS - Grupos en los que un usuario esta
    List<Member> findByEmailAndStatus(String email, Boolean status);

    // GROUPNAME y STATUS - Miembros activos de un grupo
    /// TODO CAMBIAR A ID YA QUE ES UNICO
    List<Member> findByGroupNameAndStatus(String groupName, Boolean status);

    Long countByGroup(Groups group);

    void deleteAllByGroup(Groups group);

    List<Member> findByIdUser(Long idUser);


}
