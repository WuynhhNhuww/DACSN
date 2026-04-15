import { Outlet, useNavigate } from "react-router-dom";
import SellerSidebar from "../components/SellerSidebar";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaSignOutAlt } from "react-icons/fa";

export default function SellerLayout() {
    const { user, logout } = useContext(AuthContext) || {};
    const navigate = useNavigate();

    useEffect(() => {
        document.body.classList.add("admin-seller-mode");
        return () => document.body.classList.remove("admin-seller-mode");
    }, []);

    const handleLogout = () => {
        logout?.();
        navigate("/login");
    };

    return (
        <div className="as-layout">
            <SellerSidebar />
            <main className="as-main">
                <div className="as-topbar">
                    <div className="as-topbar-title">WPN Store — Kênh Người Bán</div>
                    <div className="as-topbar-actions">
                        {user && (
                            <div className="as-user-profile">
                                <div className="as-avatar">
                                    {user.name?.charAt(0)?.toUpperCase() || "S"}
                                </div>
                                <div style={{ lineHeight: 1.2 }}>
                                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--as-text)" }}>
                                        {user.sellerInfo?.shopName || user.name}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--as-text-muted)" }}>Người bán</div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    title="Đăng xuất"
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--as-text-muted)", padding: "4px 8px", borderRadius: 8, transition: "color 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.color = "var(--as-danger)"}
                                    onMouseLeave={e => e.currentTarget.style.color = "var(--as-text-muted)"}
                                >
                                    <FaSignOutAlt size={16} />
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
