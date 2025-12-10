package utez.edu.mx.tdsw.controllers.order;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.tdsw.annotation.LogAuditoria;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.order.Order;
import utez.edu.mx.tdsw.models.order.OrderDTO;
import utez.edu.mx.tdsw.models.order.OrderService;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"*"})
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAllOrders() {
        return orderService.getAll();
    }

    @GetMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getOrderById(@PathVariable Long id) {
        return orderService.getById(id);
    }

    @GetMapping("/delivery/{deliveryId}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getOrdersByDeliveryPerson(@PathVariable Long deliveryId) {
        return orderService.getByDeliveryPerson(deliveryId);
    }

    @GetMapping("/store/{storeId}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getOrdersByStore(@PathVariable Long storeId) {
        return orderService.getByStore(storeId);
    }

    @GetMapping("/status/{status}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getOrdersByStatus(@PathVariable String status) {
        return orderService.getByStatus(status);
    }

    @GetMapping("/unsynced")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getUnsyncedOrders() {
        return orderService.getUnsynced();
    }

    @PostMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> createOrder(@RequestBody Order order) {
        return orderService.create(order);
    }

    @PostMapping("/qr/{qrCode}/delivery/{deliveryId}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> createOrderByQR(
            @PathVariable String qrCode,
            @PathVariable Long deliveryId,
            @RequestBody OrderDTO orderDTO) {
        return orderService.createByQR(qrCode, deliveryId, orderDTO);
    }

    @PutMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updateOrder(@PathVariable Long id, @RequestBody Order order) {
        return orderService.update(id, order);
    }

    @PatchMapping("/{id}/status")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return orderService.updateStatus(id, status);
    }

    @PatchMapping("/{id}/sync")
    @LogAuditoria
    public ResponseEntity<ApiResponse> markAsSynced(@PathVariable Long id) {
        return orderService.markAsSynced(id);
    }

    @DeleteMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> deleteOrder(@PathVariable Long id) {
        return orderService.delete(id);
    }
}
