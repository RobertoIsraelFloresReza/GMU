package utez.edu.mx.tdsw.services.auditoria;

import utez.edu.mx.tdsw.models.auditoria.AuditoriaLog;
import utez.edu.mx.tdsw.models.auditoria.AuditoriaRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuditoriaService {
    private final AuditoriaRepository repository;

    public AuditoriaService(AuditoriaRepository repository) {
        this.repository = repository;
    }

    public void registrarAccion(String accion, String modulo, String detalles, HttpServletRequest request) {
        String usuario = SecurityContextHolder.getContext().getAuthentication().getName();
        String ip = request.getRemoteAddr();

        AuditoriaLog log = new AuditoriaLog();
        log.setUsuario(usuario);
        log.setAccion(accion);
        log.setModulo(modulo);
        log.setDetalles(detalles);
        log.setIp(ip);

        repository.save(log);
    }
}