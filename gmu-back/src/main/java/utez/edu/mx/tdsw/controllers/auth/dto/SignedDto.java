package utez.edu.mx.tdsw.controllers.auth.dto;

import utez.edu.mx.tdsw.models.role.Role;
import utez.edu.mx.tdsw.models.user.Users;
import lombok.Value;

@Value
public class SignedDto {
    String token;
    String tokenType;
    Users user;
    Role roles;
}
