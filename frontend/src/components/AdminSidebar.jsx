import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import {
    FaTachometerAlt, FaUsers, FaStore, FaExclamationTriangle,
    FaBox, FaTag, FaBullhorn, FaShieldAlt
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

export default function AdminSidebar() {
    const { pathname } = useLocation();
    const { user } = useContext(AuthContext) || {};

    const links = [
        { name: "Tổng quan", path: "/admin/dashboard", icon: <FaTachometerAlt /> },
        { name: "Người dùng", path: "/admin/users", icon: <FaUsers /> },
        { name: "Người bán", path: "/admin/sellers", icon: <FaStore /> },
        { name: "Sản phẩm", path: "/admin/products", icon: <FaBox /> },
        { name: "Voucher", path: "/admin/vouchers", icon: <FaTag /> },
        { name: "Banner QC", path: "/admin/banners", icon: <FaBullhorn /> },
        { name: "Khiếu nại", path: "/admin/complaints", icon: <FaExclamationTriangle /> },
    ];

    return (
        <aside className="as-sidebar">
            <div className="as-sidebar-header">
                <div className="as-sidebar-logo">
                    <div className="as-sidebar-logo-icon">
                        <FaShieldAlt />
                    </div>
                    <div className="as-sidebar-logo-text">
                        <span>WPN Store</span>
                        <span>Admin Panel</span>
                    </div>
                </div>
            </div>

            <nav className="as-sidebar-nav">
                <div className="as-nav-section-title">Quản trị</div>
                {links.map(lx => {
                    const active = pathname.startsWith(lx.path);
                    return (
                        <Link
                            key={lx.path}
                            to={lx.path}
                            className={`as-nav-link ${active ? "active" : ""}`}
                        >
                            <div className="as-nav-indicator" />
                            <span className="icon">{lx.icon}</span>
                            <span>{lx.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="as-sidebar-footer">
                {user && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", borderRadius: 12,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.07)"
                    }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: "linear-gradient(135deg, #6366f1, #818cf8)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.8rem", fontWeight: 700, color: "white", flexShrink: 0,
                        }}>
                            {user.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div style={{ lineHeight: 1.25, overflow: "hidden" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", textTransform: "capitalize" }}>{user.role}</div>
                        </div>
                    </div>
                )}
                <div className="as-sidebar-footer-version">v2.0 · WPN Admin</div>
            </div>
        </aside>
    );
}
