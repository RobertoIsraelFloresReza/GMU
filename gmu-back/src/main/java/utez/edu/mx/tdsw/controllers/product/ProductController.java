package utez.edu.mx.tdsw.controllers.product;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import utez.edu.mx.tdsw.annotation.LogAuditoria;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.product.Product;
import utez.edu.mx.tdsw.models.product.ProductService;

import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {"*"})
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> getAllProducts() {
        return productService.getAll();
    }

    @GetMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getProductById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @GetMapping("/sku/{sku}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getProductBySku(@PathVariable String sku) {
        return productService.getBySku(sku);
    }

    @GetMapping("/category/{category}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getProductsByCategory(@PathVariable String category) {
        return productService.getByCategory(category);
    }

    @GetMapping("/search")
    @LogAuditoria
    public ResponseEntity<ApiResponse> searchProductsByName(@RequestParam String name) {
        return productService.searchByName(name);
    }

    @GetMapping("/active")
    @LogAuditoria
    public ResponseEntity<ApiResponse> getActiveProducts() {
        return productService.getActiveProducts();
    }

    @PostMapping
    @LogAuditoria
    public ResponseEntity<ApiResponse> createProduct(@RequestBody Product product) {
        return productService.create(product);
    }

    @PutMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        return productService.update(id, product);
    }

    @DeleteMapping("/{id}")
    @LogAuditoria
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable Long id) {
        return productService.delete(id);
    }

    @PatchMapping("/{id}/status")
    @LogAuditoria
    public ResponseEntity<ApiResponse> changeProductStatus(@PathVariable Long id) {
        return productService.changeStatus(id);
    }

    @PatchMapping("/{id}/stock")
    @LogAuditoria
    public ResponseEntity<ApiResponse> updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> request) {
        Integer quantity = request.get("quantity");
        return productService.updateStock(id, quantity);
    }
}
