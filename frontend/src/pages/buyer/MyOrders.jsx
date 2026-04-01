import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaBox, FaChevronRight, FaShoppingBag, FaStore } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import ShopeeFooter from "../../components/ShopeeFooter";

const STATUS_TABS = [
    { key: "all", label: "All Orders" },
    { key: "pending_confirmation", label: "To Confirm" },
    { key: "confirmed", label: "In Progress" },
    { key: "shipping", label: "Shipping" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
];

const STATUS_LABELS = {
    pending_payment: { label: "To Pay", cls: "badge-warning" },
    pending_confirmation: { label: "To Confirm", cls: "badge-warning" },
    paid: { label: "Paid", cls: "badge-active" },
    confirmed: { label: "Confirmed", cls: "badge-active" },
    shipping: { label: "Shipping", cls: "badge-shipping" },
    delivered: { label: "Delivered", cls: "badge-shipping" },
    completed: { label: "Completed", cls: "badge-completed" },
    cancelled: { label: "Cancelled", cls: "badge-cancelled" },
    delivery_failed: { label: "Failed", cls: "badge-cancelled" },
};

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

export default function MyOrders() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("all");

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        if (user.role === "seller" || user.role === "admin") {
            navigate("/");
            return;
        }
        axiosClient.get("/api/orders/my")
            .then(res => setOrders(res.data || []))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [user]);

    const handleCancelOrder = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            await axiosClient.patch(`/api/orders/${id}/cancel`);
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status: "cancelled" } : o));
            alert("Order cancelled successfully!");
        } catch (err) {
            alert(err?.response?.data?.message || "Error cancelling order.");
        }
    };

    const filtered = tab === "all" ? orders : orders.filter(o => o.status === tab);

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 60 }}>
            <div className="container" style={{ paddingTop: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
                    <FaShoppingBag style={{ color: "var(--primary)" }} /> My Orders
                </h1>

                {/* Status Tabs */}
                <div style={{ background: "#fff", borderRadius: 20, boxShadow: "var(--shadow-sm)", marginBottom: 24, overflow: "hidden", border: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", borderBottom: "1px solid var(--line)", overflowX: "auto" }}>
                        {STATUS_TABS.map(t => (
                            <button key={t.key}
                                onClick={() => setTab(t.key)}
                                style={{
                                    flex: 1, minWidth: 120, padding: "20px 16px", border: 0, background: 0, cursor: "pointer",
                                    fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
                                    color: tab === t.key ? "var(--primary)" : "var(--text-light)",
                                    borderBottom: tab === t.key ? "3px solid var(--primary)" : "3px solid transparent",
                                    transition: "all 0.2s", whiteSpace: "nowrap",
                                }}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="loading" style={{ padding: 60, textAlign: "center" }}>Retrieving your orders...</div>
                ) : filtered.length === 0 ? (
                    <div className="card" style={{ padding: 80, textAlign: "center", borderRadius: 24, boxShadow: "var(--shadow-sm)", background: "#fff" }}>
                        <div style={{ fontSize: 64, marginBottom: 24 }}>📭</div>
                        <h2 style={{ marginBottom: 12 }}>No orders found</h2>
                        <p style={{ color: "var(--text-light)", marginBottom: 32 }}>Try exploring our unique collections!</p>
                        <button className="btn btn-primary" onClick={() => navigate("/products")} style={{ padding: "12px 32px", borderRadius: 12 }}>Start Shopping</button>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {filtered.map(order => {
                            const st = STATUS_LABELS[order.status] || { label: order.status, cls: "badge-pending" };
                            return (
                                <div key={order._id} className="card" style={{ cursor: "pointer", padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)", transition: "transform 0.2s, box-shadow 0.2s" }} onClick={() => navigate(`/buyer/orders/${order._id}`)} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-lighter)", letterSpacing: "0.05em" }}>ORDER #{order._id.slice(-8).toUpperCase()}</span>
                                            <span className={`badge-status ${st.cls}`} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8 }}>{st.label}</span>
                                        </div>
                                        <FaChevronRight size={14} color="var(--text-lighter)" />
                                    </div>

                                    {order.orderItems?.length > 0 && (
                                        <div style={{ fontWeight: 700, padding: "12px 0", marginBottom: 20, fontSize: 13, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8, color: "var(--text-light)" }}>
                                            <FaStore /> {order.orderItems[0].seller?.sellerInfo?.shopName || "Modern Partner"}
                                            {new Set(order.orderItems.map(it => it.seller?._id || it.seller)).size > 1 && <span style={{ fontWeight: 400, color: "var(--text-lighter)", fontSize: 11 }}>(and others)</span>}
                                        </div>
                                    )}

                                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                                        {order.orderItems?.slice(0, 2).map((item, i) => (
                                            <div key={i} style={{ display: "flex", gap: 20, alignItems: "center" }}>
                                                <div style={{ width: 64, height: 64, borderRadius: 12, background: "#f8fafc", overflow: "hidden", flexShrink: 0, border: "1px solid #f1f5f9" }}>
                                                    {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.2 }}>📦</span>}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "var(--text)" }}>{item.name}</div>
                                                    <div style={{ fontSize: 14, color: "var(--text-light)" }}>{item.qty} × {fmt(item.unitPrice)}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {order.orderItems?.length > 2 && (
                                            <div style={{ fontSize: 13, color: "var(--text-lighter)", fontStyle: "italic", marginLeft: 84 }}>... and {order.orderItems.length - 2} more items</div>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid var(--line)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <span style={{ fontSize: 13, color: "var(--text-lighter)", fontWeight: 500 }}>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                            {["pending_payment", "pending_confirmation"].includes(order.status) && (
                                                <button
                                                    onClick={(e) => handleCancelOrder(e, order._id)}
                                                    className="btn"
                                                    style={{ padding: "6px 16px", fontSize: 12, fontWeight: 700, borderRadius: 8, background: "rgba(239, 68, 68, 0.1)", color: "var(--accent)", border: "none" }}
                                                >
                                                    Cancel Order
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 12, color: "var(--text-lighter)", marginBottom: 2 }}>Order Total</div>
                                            <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: 20 }}>{fmt(order.totalPrice)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <ShopeeFooter />
        </div>
    );
}
