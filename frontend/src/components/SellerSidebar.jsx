import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import {
    FaChartBar, FaBox, FaPlus, FaClipboardList,
    FaTags, FaTachometerAlt, FaStore, FaExclamationTriangle, FaComments,
    FaStar, FaWallet
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import socket from "../utils/socket";

const LINKS = [
    { icon: <FaTachometerAlt />, label: "Dashboard", path: "/seller/dashboard" },
    { icon: <FaBox />, label: "Sản phẩm", path: "/seller/products", badgeKey: "products" },
    { icon: <FaPlus />, label: "Thêm sản phẩm", path: "/seller/products/new" },
    { icon: <FaClipboardList />, label: "Đơn hàng", path: "/seller/orders", badgeKey: "orders" },
    { icon: <FaComments />, label: "Tin nhắn", path: "/seller/messages", badgeKey: "messages" },
    { icon: <FaStar />, label: "Đánh giá", path: "/seller/reviews", badgeKey: "reviews" },
    { icon: <FaTags />, label: "Vouchers", path: "/seller/vouchers" },
    { icon: <FaStore />, label: "Dịch vụ Xtra", path: "/seller/premium-service" },
    { icon: <FaChartBar />, label: "Quảng cáo", path: "/seller/ads", badgeKey: "banners" },
    { icon: <FaExclamationTriangle />, label: "Khiếu nại", path: "/seller/complaints", badgeKey: "complaints" },
    { icon: <FaWallet />, label: "Ví WNPPAY", path: "/seller/wallet" },
];

export default function SellerSidebar() {
    const location = useLocation();
    const { user } = useContext(AuthContext) || {};
    const [pendingOrders, setPendingOrders] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [sellerBadges, setSellerBadges] = useState({
        products: 0,
        banners: 0,
        complaints: 0,
        reviews: 0
    });

    useEffect(() => {
        if (!user) return;
        
        socket.emit("join", user._id);
        
        const fetchPendingOrders = async () => {
            try {
                const res = await axiosClient.get("/api/orders/seller-orders/pending-count");
                setPendingOrders(res.data.count || 0);
            } catch (err) {}
        };
        
        const fetchUnreadMessages = async () => {
            try {
                const res = await axiosClient.get("/api/chat/unread");
                setUnreadMessages(res.data.unreadCount || 0);
            } catch (err) {}
        };

        const fetchSellerBadges = async () => {
            try {
                const res = await axiosClient.get("/api/badges/seller");
                setSellerBadges(res.data);
            } catch (err) {}
        };
        
        fetchPendingOrders();
        fetchUnreadMessages();
        fetchSellerBadges();

        const handleNewOrder = () => setPendingOrders(prev => prev + 1);
        const handleNewMessage = (msg) => {
            if (msg.receiver === user._id) {
                setUnreadMessages(prev => prev + 1);
            }
        };
        const handleOrderUpdate = () => fetchPendingOrders();
        const handleChatRead = () => fetchUnreadMessages();
        const handleSellerBadgeUpdate = () => fetchSellerBadges();

        socket.on("new_order", handleNewOrder);
        socket.on("order_updated", handleOrderUpdate);
        socket.on("new_message", handleNewMessage);
        window.addEventListener("chat_read", handleChatRead);
        socket.on("messages_read", handleChatRead);
        socket.on("seller_badge_update", handleSellerBadgeUpdate);
        
        return () => {
            socket.off("new_order", handleNewOrder);
            socket.off("order_updated", handleOrderUpdate);
            socket.off("new_message", handleNewMessage);
            socket.off("messages_read", handleChatRead);
            socket.off("seller_badge_update", handleSellerBadgeUpdate);
            window.removeEventListener("chat_read", handleChatRead);
        };
    }, [user]);

    return (
        <aside className="as-sidebar">
            <div className="as-sidebar-header">
                <FaStore style={{ marginRight: 8, color: "var(--as-primary)" }} /> Kênh <strong>Người bán</strong>
            </div>
            <nav className="as-sidebar-nav">
                {LINKS.map(l => {
                    let badgeValue = 0;
                    if (l.badgeKey === "orders") badgeValue = pendingOrders;
                    else if (l.badgeKey === "messages") badgeValue = unreadMessages;
                    else if (l.badgeKey) badgeValue = sellerBadges[l.badgeKey] || 0;

                    return (
                        <Link
                            key={l.path}
                            to={l.path}
                            className={`as-nav-link ${location.pathname === l.path ? "active" : ""}`}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span className="icon">{l.icon}</span>
                                {l.label}
                            </div>
                            {badgeValue > 0 && (
                                <div style={{
                                    background: l.badgeKey === "messages" ? "var(--as-primary)" : "var(--as-danger)", 
                                    color: "#fff", borderRadius: "50%",
                                    fontSize: 10, fontWeight: 700, minWidth: 20, height: 20,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    padding: "0 4px", marginLeft: 8
                                }}>
                                    {badgeValue > 9 ? "9+" : badgeValue}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
