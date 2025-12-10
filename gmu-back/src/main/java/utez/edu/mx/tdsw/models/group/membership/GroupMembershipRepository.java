package utez.edu.mx.tdsw.models.group.membership;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMembershipRepository extends JpaRepository<GroupMembership, Long> {
    // Buscar un miembro por ID de grupo y correo de usuario (si lo necesitas aún)
    /*@Query("SELECT gm FROM GroupMembership gm WHERE gm.id = :groupId AND gm.email = :userEmail AND gm.status = true")
    Optional<GroupMembership> findByGroupIdAndUserEmailAndStatusTrue(@Param("groupId") Long groupId, @Param("userEmail") String userEmail);*/

    // Verificar si un usuario ya pertenece a un grupo
    @Query("SELECT gm FROM GroupMembership gm WHERE gm.email = :email AND gm.groupName = :groupName")
    Optional<GroupMembership> findByUserEmailAndGroupName(@Param("email") String email, @Param("groupName") String groupName);

    // Obtener todos los miembros de un grupo
    @Query("SELECT gm FROM GroupMembership gm WHERE gm.groupName = :groupName AND gm.status = true")
    List<GroupMembership> findByGroupNameAndStatusTrue(@Param("groupName") String groupName);

    // Obtener todos los grupos de un usuario
    @Query("SELECT gm FROM GroupMembership gm WHERE gm.email = :email AND gm.status = true")
    List<GroupMembership> findByUserEmailAndStatusTrue(@Param("email") String email);

    // Obtener todos los miembros activos de un grupo por ID
    @Query("SELECT gm FROM GroupMembership gm WHERE gm.id = :groupId")
    List<GroupMembership> findByGroupId(@Param("groupId") Long groupId);
}
