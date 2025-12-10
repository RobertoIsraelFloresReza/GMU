package utez.edu.mx.tdsw.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogAuditoria {  // ¡Cambiado de LogTransaccion a LogAuditoria!
}