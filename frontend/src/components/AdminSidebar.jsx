import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import {
    FaTachometerAlt, FaUsers, FaStore, FaExclamationTriangle
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

export default function AdminSidebar() {
    const { pathname } = useLocation();
    const { user } = useContext(AuthContext) || {};

    const links = [
        { name: "Tổng quan", path: "/admin/dashboard", icon: <FaTachometerAlt /> },
        { name: "Quản lý Người dùng", path: "/admin/users", icon: <FaUsers /> },
        { name: "Duyệt Người bán", path: "/admin/sellers", icon: <FaStore /> },
        { name: "Khiếu nại", path: "/admin/complaints", icon: <FaExclamationTriangle /> },
    ];

    return (
        <aside className="as-sidebar">
            <div className="as-sidebar-header">
                <div>Shopee <strong>Admin</strong></div>
            </div>
            <nav className="as-sidebar-nav">
                {links.map(lx => {
                    const active = pathname.includes(lx.path);
                    return (
                        <Link
                            key={lx.path}
                            to={lx.path}
                            className={`as-nav-link ${active ? "active" : ""}`}
                        >
                            <span className="icon">{lx.icon}</span>
                            {lx.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
