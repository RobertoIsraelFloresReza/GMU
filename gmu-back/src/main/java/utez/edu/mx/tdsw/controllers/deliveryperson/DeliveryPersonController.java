package utez.edu.mx.tdsw.controllers.deliveryperson;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.tdsw.annotation.LogAuditoria;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.deliveryperson.DeliveryPerson;
import utez.edu.mx.tdsw.models.deliveryperson.DeliveryPersonService;

@RestController
@RequestMapping("/api/delivery-persons")
@CrossOrigin(origins = {"*"})
public class DeliveryPersonController {

    private final DeliveryPersonService deliveryPersonService;

    public DeliveryPersonController(DeliveryPersonService deliveryPersonService) {
        this.deliveryPersonService = deliveryPersonService;
    }

    @GetMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAllDeliveryPersons() {
        return deliveryPersonService.getAll();
    }

    @GetMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getDeliveryPersonById(@PathVariable Long id) {
        return deliveryPersonService.getById(id);
    }

    @GetMapping("/email/{email}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getDeliveryPersonByEmail(@PathVariable String email) {
        return deliveryPersonService.getByEmail(email);
    }

    @GetMapping("/active")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getActiveDeliveryPersons() {
        return deliveryPersonService.getActiveDeliveryPersons();
    }

    @PostMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> createDeliveryPerson(@RequestBody DeliveryPerson deliveryPerson) {
        return deliveryPersonService.create(deliveryPerson);
    }

    @PutMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updateDeliveryPerson(@PathVariable Long id, @RequestBody DeliveryPerson deliveryPerson) {
        return deliveryPersonService.update(id, deliveryPerson);
    }

    @DeleteMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> deleteDeliveryPerson(@PathVariable Long id) {
        return deliveryPersonService.delete(id);
    }

    @PatchMapping("/{id}/status")
    @LogAuditoria
    public ResponseEntity<ApiResponse> changeDeliveryPersonStatus(@PathVariable Long id) {
        return deliveryPersonService.changeStatus(id);
    }

    @PutMapping("/{id}/password")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updatePassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> passwords) {
        String currentPassword = passwords.get("currentPassword");
        String newPassword = passwords.get("newPassword");
        return deliveryPersonService.updatePassword(id, currentPassword, newPassword);
    }
}
