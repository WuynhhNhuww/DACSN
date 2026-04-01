import { Outlet } from "react-router-dom";
import SellerSidebar from "../components/SellerSidebar";
import { useEffect } from "react";

export default function SellerLayout() {
    useEffect(() => {
        document.body.classList.add("admin-seller-mode");
        return () => document.body.classList.remove("admin-seller-mode");
    }, []);

    return (
        <div className="as-layout">
            <SellerSidebar />
            <main className="as-main">
                <div className="as-topbar">
                    <div className="as-topbar-title">Shopee Kênh Người Bán</div>
                </div>
                <div className="as-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
