package utez.edu.mx.tdsw.models.fcmtoken;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FcmTokenDTO {
    private Long userId;
    private String token;
    private String deviceType; // WEB, ANDROID, IOS
}
