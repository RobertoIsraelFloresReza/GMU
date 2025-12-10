package utez.edu.mx.tdsw.models.store;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.tdsw.config.ApiResponse;

import java.util.List;

@Service
@Transactional
public class StoreService {

    private static final String STORE_NOT_FOUND = "Tienda no encontrada";
    private static final String QR_CODE_EXISTS = "El código QR ya está registrado";
    private static final String STORE_NAME_EXISTS = "Ya existe una tienda con ese nombre";

    private final StoreRepository storeRepository;

    public StoreService(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getAll() {
        List<Store> stores = storeRepository.findAll();
        return new ResponseEntity<>(new ApiResponse(stores, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getById(Long id) {
        return storeRepository.findById(id)
                .map(store -> new ResponseEntity<>(new ApiResponse(store, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(STORE_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getByQrCode(String qrCode) {
        return storeRepository.findByQrCode(qrCode)
                .map(store -> new ResponseEntity<>(new ApiResponse(store, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(STORE_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getActiveStores() {
        List<Store> stores = storeRepository.findByStatus(true);
        return new ResponseEntity<>(new ApiResponse(stores, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> create(Store store) {
        // Validar que el QR code no exista (si se proporcionó)
        if (store.getQrCode() != null && !store.getQrCode().isEmpty() && storeRepository.existsByQrCode(store.getQrCode())) {
            return new ResponseEntity<>(new ApiResponse(QR_CODE_EXISTS, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
        }

        // Validar que el nombre no exista
        if (storeRepository.existsByNameIgnoreCase(store.getName())) {
            return new ResponseEntity<>(new ApiResponse(STORE_NAME_EXISTS, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
        }

        Store savedStore = storeRepository.save(store);
        return new ResponseEntity<>(new ApiResponse(savedStore, HttpStatus.CREATED), HttpStatus.CREATED);
    }

    @Transactional
    public ResponseEntity<ApiResponse> update(Long id, Store store) {
        if (!storeRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(STORE_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        // Validar QR code único (excepto el actual, si se proporcionó)
        if (store.getQrCode() != null && !store.getQrCode().isEmpty()) {
            storeRepository.findByQrCode(store.getQrCode()).ifPresent(existingStore -> {
                if (!existingStore.getIdStore().equals(id)) {
                    throw new IllegalArgumentException(QR_CODE_EXISTS);
                }
            });
        }

        store.setIdStore(id);
        Store updatedStore = storeRepository.save(store);
        return new ResponseEntity<>(new ApiResponse(updatedStore, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> delete(Long id) {
        if (!storeRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(STORE_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        storeRepository.deleteById(id);
        return new ResponseEntity<>(new ApiResponse("Tienda eliminada exitosamente", HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> changeStatus(Long id) {
        return storeRepository.findById(id)
                .map(store -> {
                    store.setStatus(!store.getStatus());
                    Store updatedStore = storeRepository.save(store);
                    return new ResponseEntity<>(new ApiResponse(updatedStore, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(STORE_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }
}
