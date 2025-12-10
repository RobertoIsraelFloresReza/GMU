package utez.edu.mx.tdsw.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.NoHandlerFoundException;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Manejar error de recursos no encontrados (404)
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<String> handleNotFoundException(NoHandlerFoundException ex) {
        return new ResponseEntity<>("Error 404: La ruta solicitada no existe.", HttpStatus.NOT_FOUND);
    }

    // Manejar errores generales del servidor (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneralException(Exception ex) {
        return new ResponseEntity<>("Error 500: Ocurrió un error inesperado.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
}