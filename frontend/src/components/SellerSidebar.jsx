import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import {
    FaChartBar, FaBox, FaPlus, FaClipboardList,
    FaTags, FaTachometerAlt, FaStore,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const LINKS = [
    { icon: <FaTachometerAlt />, label: "Dashboard", path: "/seller/dashboard" },
    { icon: <FaBox />, label: "Sản phẩm", path: "/seller/products" },
    { icon: <FaPlus />, label: "Thêm sản phẩm", path: "/seller/products/new" },
    { icon: <FaClipboardList />, label: "Đơn hàng", path: "/seller/orders" },
    { icon: <FaTags />, label: "Khuyến mãi", path: "/seller/promotions" },
    { icon: <FaChartBar />, label: "Phân tích", path: "/seller/analytics" },
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
