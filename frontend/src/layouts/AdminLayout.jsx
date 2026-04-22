import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaSignOutAlt, FaBell } from "react-icons/fa";

const PAGE_TITLES = {
    "/admin/dashboard": { title: "Tổng quan Hệ thống", sub: "Xem số liệu và hiệu suất toàn sàn" },
    "/admin/users": { title: "Quản lý Người dùng", sub: "Danh sách tài khoản người mua" },
    "/admin/sellers": { title: "Quản lý Gian hàng", sub: "Duyệt và quản lý người bán" },
    "/admin/products": { title: "Quản lý Sản phẩm", sub: "Kiểm duyệt sản phẩm đăng bán" },
    "/admin/vouchers": { title: "Mã Giảm Giá Toàn Sàn", sub: "Tạo và quản lý voucher platform" },
    "/admin/banners": { title: "Hệ thống Quảng cáo", sub: "Duyệt và theo dõi banner" },
    "/admin/complaints": { title: "Khiếu nại & Tranh chấp", sub: "Phân xử và giải quyết khiếu nại" },
    "/admin/wallet": { title: "Ví ShopeePay", sub: "Quản lý số dư và giao dịch ví điện tử" },
};

export default function AdminLayout() {
    const { user, logout } = useContext(AuthContext) || {};
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        document.body.classList.add("admin-seller-mode");
        return () => document.body.classList.remove("admin-seller-mode");
    }, []);

    const handleLogout = () => {
        logout?.();
        navigate("/login");
    };

    const pageInfo = PAGE_TITLES[location.pathname] || { title: "Admin", sub: "WPN Store" };

    return (
        <div className="as-layout">
            <AdminSidebar />
            <main className="as-main">
                <div className="as-topbar">
                    <div className="as-topbar-left">
                        <div className="as-topbar-title">{pageInfo.title}</div>
                        <div className="as-topbar-subtitle">{pageInfo.sub}</div>
                    </div>
                    <div className="as-topbar-actions">
                        <button className="as-topbar-icon-btn" title="Thông báo">
                            <FaBell size={15} />
                        </button>
                        {user && (
                            <div className="as-user-profile">
                                <div className="as-avatar">
                                    {user.name?.charAt(0)?.toUpperCase() || "A"}
                                </div>
                                <div className="as-user-info">
                                    <div className="as-user-name">{user.name}</div>
                                    <div className="as-user-role">{user.role}</div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="as-logout-btn"
                                    title="Đăng xuất"
                                >
                                    <FaSignOutAlt size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="as-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
