package utez.edu.mx.tdsw.controllers.store;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.tdsw.annotation.LogAuditoria;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.store.Store;
import utez.edu.mx.tdsw.models.store.StoreService;

@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = {"*"})
public class StoreController {

    private final StoreService storeService;

    public StoreController(StoreService storeService) {
        this.storeService = storeService;
    }

    @GetMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAllStores() {
        return storeService.getAll();
    }

    @GetMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getStoreById(@PathVariable Long id) {
        return storeService.getById(id);
    }

    @GetMapping("/qr/{qrCode}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getStoreByQrCode(@PathVariable String qrCode) {
        return storeService.getByQrCode(qrCode);
    }

    @GetMapping("/active")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getActiveStores() {
        return storeService.getActiveStores();
    }

    @PostMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> createStore(@RequestBody Store store) {
        return storeService.create(store);
    }

    @PutMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updateStore(@PathVariable Long id, @RequestBody Store store) {
        return storeService.update(id, store);
    }

    @DeleteMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> deleteStore(@PathVariable Long id) {
        return storeService.delete(id);
    }

    @PatchMapping("/{id}/status")
    @LogAuditoria
    public ResponseEntity<ApiResponse> changeStoreStatus(@PathVariable Long id) {
        return storeService.changeStatus(id);
    }
}
