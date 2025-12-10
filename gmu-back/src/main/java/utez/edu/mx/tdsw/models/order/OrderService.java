package utez.edu.mx.tdsw.models.order;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import utez.edu.mx.tdsw.config.ApiResponse;
import utez.edu.mx.tdsw.models.deliveryperson.DeliveryPersonRepository;
import utez.edu.mx.tdsw.models.notification.Notification;
import utez.edu.mx.tdsw.models.notification.NotificationDTO;
import utez.edu.mx.tdsw.models.notification.NotificationService;
import utez.edu.mx.tdsw.models.product.ProductRepository;
import utez.edu.mx.tdsw.models.role.Role;
import utez.edu.mx.tdsw.models.store.Store;
import utez.edu.mx.tdsw.models.store.StoreRepository;
import utez.edu.mx.tdsw.models.user.Users;
import utez.edu.mx.tdsw.models.user.UsersRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class OrderService {

    private static final String ORDER_NOT_FOUND = "Pedido no encontrado";
    private static final String STORE_NOT_FOUND = "Tienda no encontrada";
    private static final String DELIVERY_PERSON_NOT_FOUND = "Repartidor no encontrado";
    private static final String PRODUCT_NOT_FOUND = "Producto no encontrado";

    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final DeliveryPersonRepository deliveryPersonRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final NotificationService notificationService;
    private final UsersRepository usersRepository;

    public OrderService(OrderRepository orderRepository,
                        StoreRepository storeRepository,
                        DeliveryPersonRepository deliveryPersonRepository,
                        ProductRepository productRepository,
                        OrderItemRepository orderItemRepository,
                        NotificationService notificationService,
                        UsersRepository usersRepository) {
        this.orderRepository = orderRepository;
        this.storeRepository = storeRepository;
        this.deliveryPersonRepository = deliveryPersonRepository;
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.notificationService = notificationService;
        this.usersRepository = usersRepository;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getAll() {
        List<Order> orders = orderRepository.findAll();
        return new ResponseEntity<>(new ApiResponse(orders, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getById(Long id) {
        return orderRepository.findById(id)
                .map(order -> new ResponseEntity<>(new ApiResponse(order, HttpStatus.OK), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getByDeliveryPerson(Long deliveryPersonId) {
        List<Order> orders = orderRepository.findByDeliveryPersonIdDeliveryPerson(deliveryPersonId);
        return new ResponseEntity<>(new ApiResponse(orders, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getByStore(Long storeId) {
        List<Order> orders = orderRepository.findByStoreIdStore(storeId);
        return new ResponseEntity<>(new ApiResponse(orders, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getByStatus(String status) {
        try {
            OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
            List<Order> orders = orderRepository.findByStatus(orderStatus);
            return new ResponseEntity<>(new ApiResponse(orders, HttpStatus.OK), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ApiResponse("Estado de pedido inválido", HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> createByQR(String qrCode, Long deliveryPersonId, OrderDTO orderDTO) {
        try {
            // Validar parámetros
            if (qrCode == null || qrCode.trim().isEmpty()) {
                return new ResponseEntity<>(new ApiResponse("Código QR es requerido", HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
            }

            if (deliveryPersonId == null) {
                return new ResponseEntity<>(new ApiResponse("ID de repartidor es requerido", HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
            }

            // Buscar tienda por QR
            Store store = storeRepository.findByQrCode(qrCode)
                    .orElseThrow(() -> new IllegalArgumentException("Código QR inválido o tienda no encontrada"));

            // Verificar que el repartidor existe
            var deliveryPerson = deliveryPersonRepository.findById(deliveryPersonId)
                    .orElseThrow(() -> new IllegalArgumentException(DELIVERY_PERSON_NOT_FOUND));

            // Crear pedido
            Order order = new Order();
            order.setStore(store);
            order.setDeliveryPerson(deliveryPerson);
            order.setOrderDate(LocalDateTime.now());
            order.setStatus(OrderStatus.PENDING);
            order.setNotes(orderDTO.getNotes());
            order.setLatitude(orderDTO.getLatitude());
            order.setLongitude(orderDTO.getLongitude());

            // Guardar pedido primero para obtener el ID
            Order savedOrder = orderRepository.save(order);

            // Agregar items si existen
            if (orderDTO.getItems() != null && !orderDTO.getItems().isEmpty()) {
                BigDecimal total = BigDecimal.ZERO;

                for (OrderItemDTO itemDTO : orderDTO.getItems()) {
                    var product = productRepository.findById(itemDTO.getProductId())
                            .orElseThrow(() -> new IllegalArgumentException(PRODUCT_NOT_FOUND + ": " + itemDTO.getProductId()));

                    OrderItem item = new OrderItem();
                    item.setOrder(savedOrder);
                    item.setProduct(product);
                    item.setQuantity(itemDTO.getQuantity());
                    item.setUnitPrice(product.getPrice());
                    item.calculateSubtotal();

                    orderItemRepository.save(item);
                    total = total.add(item.getSubtotal());
                }

                savedOrder.setTotal(total);
                savedOrder = orderRepository.save(savedOrder);
            }

            // Enviar notificaciones a TODOS los administradores
            sendOrderCreatedNotification(savedOrder);

            return new ResponseEntity<>(new ApiResponse(savedOrder, HttpStatus.CREATED), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ApiResponse(e.getMessage(), HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse("Error al crear pedido: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> create(Order order) {
        try {
            if (order.getStore() == null || !storeRepository.existsById(order.getStore().getIdStore())) {
                return new ResponseEntity<>(new ApiResponse(STORE_NOT_FOUND, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
            }

            if (order.getDeliveryPerson() == null || !deliveryPersonRepository.existsById(order.getDeliveryPerson().getIdDeliveryPerson())) {
                return new ResponseEntity<>(new ApiResponse(DELIVERY_PERSON_NOT_FOUND, HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
            }

            Order savedOrder = orderRepository.save(order);
            return new ResponseEntity<>(new ApiResponse(savedOrder, HttpStatus.CREATED), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse("Error al crear pedido: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> update(Long id, Order order) {
        if (!orderRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        order.setIdOrder(id);
        Order updatedOrder = orderRepository.save(order);
        return new ResponseEntity<>(new ApiResponse(updatedOrder, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> updateStatus(Long id, String status) {
        try {
            OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
            return orderRepository.findById(id)
                    .map(order -> {
                        order.setStatus(orderStatus);
                        Order updatedOrder = orderRepository.save(order);
                        return new ResponseEntity<>(new ApiResponse(updatedOrder, HttpStatus.OK), HttpStatus.OK);
                    })
                    .orElseGet(() -> new ResponseEntity<>(new ApiResponse(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ApiResponse("Estado de pedido inválido", HttpStatus.BAD_REQUEST), HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional
    public ResponseEntity<ApiResponse> delete(Long id) {
        if (!orderRepository.existsById(id)) {
            return new ResponseEntity<>(new ApiResponse(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND);
        }

        orderRepository.deleteById(id);
        return new ResponseEntity<>(new ApiResponse("Pedido eliminado exitosamente", HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse> getUnsynced() {
        List<Order> orders = orderRepository.findBySyncedFalse();
        return new ResponseEntity<>(new ApiResponse(orders, HttpStatus.OK), HttpStatus.OK);
    }

    @Transactional
    public ResponseEntity<ApiResponse> markAsSynced(Long id) {
        return orderRepository.findById(id)
                .map(order -> {
                    order.setSynced(true);
                    Order updatedOrder = orderRepository.save(order);
                    return new ResponseEntity<>(new ApiResponse(updatedOrder, HttpStatus.OK), HttpStatus.OK);
                })
                .orElseGet(() -> new ResponseEntity<>(new ApiResponse(ORDER_NOT_FOUND, HttpStatus.NOT_FOUND), HttpStatus.NOT_FOUND));
    }

    // Método privado para enviar notificaciones cuando se crea un pedido
    private void sendOrderCreatedNotification(Order order) {
        try {
            // Buscar todos los usuarios ADMIN
            List<Users> adminUsers = usersRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "ADMIN".equals(u.getRole().getName()))
                .toList();

            for (Users admin : adminUsers) {
                NotificationDTO notificationDTO = new NotificationDTO();
                notificationDTO.setUserId(admin.getIdUser());
                notificationDTO.setTitle("Nuevo Pedido Creado");
                notificationDTO.setMessage(String.format("El repartidor %s %s creó un pedido en %s por $%.2f",
                    order.getDeliveryPerson().getFirstName(),
                    order.getDeliveryPerson().getLastName(),
                    order.getStore().getName(),
                    order.getTotal() != null ? order.getTotal() : BigDecimal.ZERO));
                notificationDTO.setType("ORDER_CREATED");
                notificationDTO.setRelatedOrderId(order.getIdOrder());
                notificationDTO.setRelatedStoreId(order.getStore().getIdStore());

                notificationService.createNotification(notificationDTO);
            }
        } catch (Exception e) {
            System.err.println("Error al enviar notificación: " + e.getMessage());
        }
    }
}
