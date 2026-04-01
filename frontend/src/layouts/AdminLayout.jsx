import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { useEffect } from "react";

export default function AdminLayout() {
    useEffect(() => {
        document.body.classList.add("admin-seller-mode");
        return () => document.body.classList.remove("admin-seller-mode");
    }, []);

    return (
        <div className="as-layout">
            <AdminSidebar />
            <main className="as-main">
                <div className="as-topbar">
                    <div className="as-topbar-title">Vietnam Shopee - Quản trị Hệ thống</div>
                    {/* Add topbar actions if needed */}
                </div>
                <div className="as-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
