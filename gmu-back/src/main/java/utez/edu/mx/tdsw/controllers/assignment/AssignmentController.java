package utez.edu.mx.tdsw.controllers.assignment;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.tdsw.annotation.LogAuditoria;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.assignment.Assignment;
import utez.edu.mx.tdsw.models.assignment.AssignmentService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = {"*"})
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @GetMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAllAssignments() {
        return assignmentService.getAll();
    }

    @GetMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAssignmentById(@PathVariable Long id) {
        return assignmentService.getById(id);
    }

    @GetMapping("/delivery/{deliveryId}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAssignmentsByDeliveryPerson(@PathVariable Long deliveryId) {
        return assignmentService.getByDeliveryPerson(deliveryId);
    }

    @GetMapping("/store/{storeId}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAssignmentsByStore(@PathVariable Long storeId) {
        return assignmentService.getByStore(storeId);
    }

    @GetMapping("/delivery/{deliveryId}/active")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getActiveAssignments(@PathVariable Long deliveryId) {
        return assignmentService.getActiveAssignments(deliveryId);
    }

    @GetMapping("/delivery/{deliveryId}/range")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAssignmentsByDateRange(
            @PathVariable Long deliveryId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return assignmentService.getByDeliveryPersonAndDateRange(deliveryId, startDate, endDate);
    }

    @GetMapping("/delivery/{deliveryId}/visited")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getVisitedAssignments(
            @PathVariable Long deliveryId,
            @RequestParam Boolean visited) {
        return assignmentService.getVisitedAssignments(deliveryId, visited);
    }

    @PostMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> createAssignment(@RequestBody Assignment assignment) {
        return assignmentService.create(assignment);
    }

    @PutMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updateAssignment(@PathVariable Long id, @RequestBody Assignment assignment) {
        return assignmentService.update(id, assignment);
    }

    @PutMapping("/{id}/visit")
    @LogAuditoria
    public ResponseEntity<ApiResponse> markVisited(@PathVariable Long id) {
        return assignmentService.markVisited(id);
    }

    @DeleteMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> deleteAssignment(@PathVariable Long id) {
        return assignmentService.delete(id);
    }

    @PatchMapping("/{id}/status")
    @LogAuditoria
    public ResponseEntity<ApiResponse> changeAssignmentStatus(@PathVariable Long id) {
        return assignmentService.changeStatus(id);
    }
}
