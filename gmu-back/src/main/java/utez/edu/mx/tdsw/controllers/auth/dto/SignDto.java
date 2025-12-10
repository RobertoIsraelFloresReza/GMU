package utez.edu.mx.tdsw.controllers.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class SignDto {
    @NotBlank
    @NotEmpty
    private String email;
    @NotBlank
    @NotEmpty
    private String password;
}
