package utez.edu.mx.tdsw.models.product;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.tdsw.config.ApiResponse;

import java.util.List;

@Service
@Transactional
public class ProductService {

    private static final String PRODUCT_NOT_FOUND = "Producto no encontrado";
    private static final String SKU_EXISTS = "El SKU ya está registrado";

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getAll() {
        List<Product> products = productRepository.findAll();
        return new ResponseEntity<>(new ApiResponse(products, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getById(Long id) {
        return productRepository.findById(id)
                .map(product -> new ResponseEntity<>(new ApiResponse(product, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getBySku(String sku) {
        return productRepository.findBySku(sku)
                .map(product -> new ResponseEntity<>(new ApiResponse(product, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getByCategory(String category) {
        List<Product> products = productRepository.findByCategory(category);
        return new ResponseEntity<>(new ApiResponse(products, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> searchByName(String name) {
        List<Product> products = productRepository.findByNameContainingIgnoreCase(name);
        return new ResponseEntity<>(new ApiResponse(products, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getActiveProducts() {
        List<Product> products = productRepository.findByStatus(true);
        return new ResponseEntity<>(new ApiResponse(products, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> create(Product product) {
        try {
            // Normalizar SKU vacío a null para evitar problemas con unique constraint
            if (product.getSku() != null && product.getSku().trim().isEmpty()) {
                product.setSku(null);
            }

            // Validar que el SKU no exista (si se proporcionó)
            if (product.getSku() != null && productRepository.existsBySku(product.getSku())) {
                return new ResponseEntity<>(new ApiResponse(SKU_EXISTS, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
            }

            Product savedProduct = productRepository.save(product);
            return new ResponseEntity<>(new ApiResponse(savedProduct, HttpStatus.CREATED), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse("Error al crear producto: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> update(Long id, Product product) {
        if (!productRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        // Validar SKU único (excepto el actual)
        if (product.getSku() != null && !product.getSku().isEmpty()) {
            productRepository.findBySku(product.getSku()).ifPresent(existingProduct -> {
                if (!existingProduct.getIdProduct().equals(id)) {
                    throw new IllegalArgumentException(SKU_EXISTS);
                }
            });
        }

        product.setIdProduct(id);
        Product updatedProduct = productRepository.save(product);
        return new ResponseEntity<>(new ApiResponse(updatedProduct, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> delete(Long id) {
        if (!productRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        productRepository.deleteById(id);
        return new ResponseEntity<>(new ApiResponse("Producto eliminado exitosamente", HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> changeStatus(Long id) {
        return productRepository.findById(id)
                .map(product -> {
                    product.setStatus(!product.getStatus());
                    Product updatedProduct = productRepository.save(product);
                    return new ResponseEntity<>(new ApiResponse(updatedProduct, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ResponseEntity<ApiResponse> updateStock(Long id, Integer quantity) {
        return productRepository.findById(id)
                .map(product -> {
                    product.setStock(product.getStock() + quantity);
                    Product updatedProduct = productRepository.save(product);
                    return new ResponseEntity<>(new ApiResponse(updatedProduct, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }
}
