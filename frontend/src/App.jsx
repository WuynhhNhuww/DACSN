import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import ShopeeHeader from "./components/ShopeeHeader";
import AuthProvider from "./context/AuthContext";
import "./styles/shopee.css";
import "./styles/admin-seller.css";

// Public
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ProductList from "./pages/public/ProductList";
import ProductDetail from "./pages/public/ProductDetail";
import ShopDetail from "./pages/public/ShopDetail";

// Buyer
import Cart from "./pages/buyer/Cart";
import Checkout from "./pages/buyer/Checkout";
import MyOrders from "./pages/buyer/MyOrders";
import OrderDetail from "./pages/buyer/OrderDetail";
import Profile from "./pages/buyer/Profile";
import Wishlist from "./pages/buyer/Wishlist";
import Wallet from "./pages/buyer/Wallet";

// Seller
import SellerDashboard from "./pages/seller/Dashboard";
import SellerProducts from "./pages/seller/Products";
import ProductCreate from "./pages/seller/ProductCreate";
import ProductEdit from "./pages/seller/ProductEdit";
import SellerOrders from "./pages/seller/Orders";
import SellerAds from "./pages/seller/Ads";
import SellerVouchers from "./pages/seller/Vouchers";
import SellerComplaints from "./pages/seller/Complaints";
import SellerMessages from "./pages/seller/Messages";
import SellerReviews from "./pages/seller/Reviews";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminSellers from "./pages/admin/Sellers";
import AdminProducts from "./pages/admin/Products";
import AdminVouchers from "./pages/admin/Vouchers";
import AdminBanners from "./pages/admin/Banners";
import AdminComplaints from "./pages/admin/Complaints";
import VNPayReturn from "./pages/buyer/VNPayReturn";
import OrderVNPayReturn from "./pages/buyer/OrderVNPayReturn";
import OrderMomoReturn from "./pages/buyer/OrderMomoReturn";


import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import SellerLayout from "./layouts/SellerLayout";

const MainLayout = () => (
  <>
    <ShopeeHeader />
    <Outlet />
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public & Buyer routes with ShopeeHeader */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/shop/:id" element={<ShopDetail />} />

            <Route path="/buyer/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/buyer/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/buyer/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="/buyer/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="/buyer/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/buyer/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="/buyer/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/buyer/wallet/vnpay-return" element={<ProtectedRoute><VNPayReturn /></ProtectedRoute>} />
            <Route path="/buyer/orders/vnpay-return" element={<ProtectedRoute><OrderVNPayReturn /></ProtectedRoute>} />
            <Route path="/buyer/orders/momo-return" element={<ProtectedRoute><OrderMomoReturn /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />

          </Route>

          {/* Seller */}
          <Route path="/seller" element={<ProtectedRoute roles={["seller", "admin"]}><SellerLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="products/new" element={<ProductCreate />} />
            <Route path="products/:id/edit" element={<ProductEdit />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="vouchers" element={<SellerVouchers />} />
            <Route path="ads" element={<SellerAds />} />
            <Route path="complaints" element={<SellerComplaints />} />
            <Route path="messages" element={<SellerMessages />} />
            <Route path="reviews" element={<SellerReviews />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="complaints" element={<AdminComplaints />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}