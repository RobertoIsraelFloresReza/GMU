package utez.edu.mx.tdsw.controllers.users.dto;

import utez.edu.mx.tdsw.models.person.Persons;
import utez.edu.mx.tdsw.models.role.Role;
import utez.edu.mx.tdsw.models.user.Users;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsersDto {
    private Long idUser;
    private String email;
    private String password;
    private Boolean status;
    private Role role;
    private Persons persons;
    private Long ventanillaId;

    public Users toEntity() {
        Users user = new Users();
        user.setIdUser(idUser);
        user.setEmail(email);
        user.setPassword(password);
        user.setStatus(status);

        if (role != null) {
            user.setRole(role);
        }
        if (persons != null) {
            user.setPersons(persons);
        }

        return user;
    }


}
