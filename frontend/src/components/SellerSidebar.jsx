import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import {
    FaChartBar, FaBox, FaPlus, FaClipboardList,
    FaTags, FaTachometerAlt, FaStore, FaExclamationTriangle, FaComments,
    FaStar, FaWallet
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const LINKS = [
    { icon: <FaTachometerAlt />, label: "Dashboard", path: "/seller/dashboard" },
    { icon: <FaBox />, label: "Sản phẩm", path: "/seller/products" },
    { icon: <FaPlus />, label: "Thêm sản phẩm", path: "/seller/products/new" },
    { icon: <FaClipboardList />, label: "Đơn hàng", path: "/seller/orders" },
    { icon: <FaComments />, label: "Tin nhắn", path: "/seller/messages" },
    { icon: <FaStar />, label: "Đánh giá", path: "/seller/reviews" },
    { icon: <FaTags />, label: "Vouchers", path: "/seller/vouchers" },
    { icon: <FaStore />, label: "Dịch vụ Xtra", path: "/seller/premium-service" },
    { icon: <FaChartBar />, label: "Quảng cáo", path: "/seller/ads" },
    { icon: <FaExclamationTriangle />, label: "Khiếu nại", path: "/seller/complaints" },
    { icon: <FaWallet />, label: "Ví ShopeePay", path: "/seller/wallet" },
];

export default function SellerSidebar() {
    const location = useLocation();
    const { user } = useContext(AuthContext) || {};

    return (
        <aside className="as-sidebar">
            <div className="as-sidebar-header">
                <FaStore style={{ marginRight: 8, color: "var(--as-primary)" }} /> Kênh <strong>Người bán</strong>
            </div>
            <nav className="as-sidebar-nav">
                {LINKS.map(l => (
                    <Link
                        key={l.path}
                        to={l.path}
                        className={`as-nav-link ${location.pathname === l.path ? "active" : ""}`}
                    >
                        <span className="icon">{l.icon}</span>
                        {l.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
