import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../modules/auth/LoginPage";
import AdminDashboard from "../modules/admin/AdminDashboard";
import DeliveryDashboard from "../modules/delivery/DeliveryDashboard";
import StoresPage from "../modules/admin/StoresPage";
import ProductsPage from "../modules/admin/ProductsPage";
import DeliveryPersonsPage from "../modules/admin/DeliveryPersonsPage";
import AssignmentsPage from "../modules/admin/AssignmentsPage";
import AdminOrdersPage from "../modules/admin/OrdersPage";
import QRScanPage from "../modules/delivery/QRScanPage";
import MapPage from "../modules/delivery/MapPage";
import MyRoutesPage from "../modules/delivery/MyRoutesPage";
import CreateOrderPage from "../modules/delivery/CreateOrderPage";
import DeliveryOrdersPage from "../modules/delivery/OrdersPage";
import ProfilePage from "../modules/profile/ProfilePage";
import ProtectedRoute from "../components/ProtectedRoute";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/stores" element={<ProtectedRoute allowedRole="ADMIN"><StoresPage /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute allowedRole="ADMIN"><ProductsPage /></ProtectedRoute>} />
        <Route path="/admin/delivery" element={<ProtectedRoute allowedRole="ADMIN"><DeliveryPersonsPage /></ProtectedRoute>} />
        <Route path="/admin/assignments" element={<ProtectedRoute allowedRole="ADMIN"><AssignmentsPage /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute allowedRole="ADMIN"><AdminOrdersPage /></ProtectedRoute>} />

        {/* Delivery Routes */}
        <Route path="/delivery/qr-scan" element={<ProtectedRoute allowedRole="DELIVERY_PERSON"><QRScanPage /></ProtectedRoute>} />
        <Route path="/delivery/routes" element={<ProtectedRoute allowedRole="DELIVERY_PERSON"><MyRoutesPage /></ProtectedRoute>} />
        <Route path="/delivery/scan" element={<ProtectedRoute allowedRole="DELIVERY_PERSON"><QRScanPage /></ProtectedRoute>} />
        <Route path="/delivery/map" element={<ProtectedRoute allowedRole="DELIVERY_PERSON"><MapPage /></ProtectedRoute>} />
        <Route path="/delivery/create-order" element={<ProtectedRoute allowedRole="DELIVERY_PERSON"><CreateOrderPage /></ProtectedRoute>} />
        <Route path="/delivery/orders" element={<ProtectedRoute allowedRole="DELIVERY_PERSON"><DeliveryOrdersPage /></ProtectedRoute>} />

        {/* Profile Route - Shared */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
