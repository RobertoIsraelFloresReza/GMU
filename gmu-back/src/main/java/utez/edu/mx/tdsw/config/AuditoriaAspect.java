package utez.edu.mx.tdsw.config;

import utez.edu.mx.tdsw.services.auditoria.AuditoriaService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpServletRequest;

@Aspect
@Component
public class AuditoriaAspect {
    private final AuditoriaService auditoriaService;
    private final HttpServletRequest request;

    public AuditoriaAspect(AuditoriaService auditoriaService, HttpServletRequest request) {
        this.auditoriaService = auditoriaService;
        this.request = request;
    }

    @Around("@annotation(utez.edu.mx.tdsw.annotation.LogAuditoria)")
    public Object logTransaccion(ProceedingJoinPoint joinPoint) throws Throwable {
        String metodo = joinPoint.getSignature().getName();
        String modulo = joinPoint.getTarget().getClass().getSimpleName();

        try {
            Object result = joinPoint.proceed(); // Ejecuta el método original
            auditoriaService.registrarAccion(
                    "EXITOSO: " + metodo,
                    modulo,
                    "Parámetros: " + joinPoint.getArgs(),
                    request
            );
            return result;
        } catch (Exception e) {
            auditoriaService.registrarAccion(
                    "FALLIDO: " + metodo,
                    modulo,
                    "Error: " + e.getMessage(),
                    request
            );
            throw e;
        }
    }
}