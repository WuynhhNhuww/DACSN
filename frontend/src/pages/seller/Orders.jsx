import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

const STATUS_OPTS = [
    { val: "confirmed", label: "Xác nhận đơn" },
    { val: "shipping", label: "Đang giao" },
    { val: "delivered", label: "Đã giao" },
    { val: "completed", label: "Hoàn thành" },
    { val: "delivery_failed", label: "Giao thất bại" },
    { val: "cancelled", label: "Hủy đơn" },
];

const STATUS_LABELS = {
    pending_payment: { label: "Chờ thanh toán", cls: "as-badge-warning" },
    paid: { label: "Đã thanh toán", cls: "as-badge-success" },
    confirmed: { label: "Đã xác nhận", cls: "as-badge-success" },
    shipping: { label: "Đang vận chuyển", cls: "as-badge-info" },
    delivered: { label: "Đã giao hàng", cls: "as-badge-success" },
    completed: { label: "Hoàn thành", cls: "as-badge-success" },
    cancelled: { label: "Đã hủy", cls: "as-badge-danger" },
    delivery_failed: { label: "Giao thất bại", cls: "as-badge-danger" },
};

export default function SellerOrders() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        axiosClient.get("/api/orders/my")
            .then(res => setOrders(res.data || []))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [user]);

    const updateStatus = async (orderId, status) => {
        setUpdating(orderId);
        try {
            await axiosClient.put(`/api/orders/${orderId}/status`, { status });
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
        } catch (err) {
            alert(err?.response?.data?.message || "Cập nhật thất bại");
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Quản lý đơn hàng</h1>
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>
                ) : orders.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", background: "white", borderRadius: 16 }}>
                        <div style={{ fontSize: "3rem", marginBottom: 16 }}>📋</div>
                        <h3 style={{ margin: "0 0 16px 0", color: "var(--as-text)" }}>Chưa có đơn hàng nào</h3>
                    </div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Mã đơn hàng</th>
                                <th>Chi tiết sản phẩm</th>
                                <th>Tổng thanh toán</th>
                                <th>Ngày đặt</th>
                                <th>Trạng thái</th>
                                <th>Cập nhật</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const st = STATUS_LABELS[order.status] || { label: order.status, cls: "as-badge-warning" };
                                return (
                                    <tr key={order._id}>
                                        <td>
                                            <div style={{ fontFamily: "monospace", fontSize: "0.95rem", fontWeight: 700, color: "var(--as-primary)", background: "rgba(79, 70, 229, 0.1)", padding: "4px 8px", borderRadius: 8, display: "inline-block" }}>
                                                #{order._id.slice(-8).toUpperCase()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                {order.orderItems?.slice(0, 2).map((it, i) => (
                                                    <div key={i} style={{ fontSize: "0.9rem", color: "var(--as-text)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                                        <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{it.name}</span>
                                                        <span style={{ fontWeight: 600, color: "var(--as-primary)", background: "rgba(0,0,0,0.03)", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>x{it.qty}</span>
                                                    </div>
                                                ))}
                                                {order.orderItems?.length > 2 && (
                                                    <div style={{ fontSize: "0.8rem", color: "var(--as-text-muted)", fontStyle: "italic", marginTop: 2 }}>+{order.orderItems.length - 2} sản phẩm khác...</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ color: "var(--as-danger)", fontWeight: 700, fontSize: "1.05rem" }}>{fmt(order.totalPrice)}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--as-text-muted)", marginTop: 4 }}>Đã bao gồm phí & giảm giá</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500, color: "var(--as-text)" }}>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--as-text-muted)", marginTop: 4 }}>{new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                                        </td>
                                        <td><span className={`as-badge ${st.cls}`}>{st.label}</span></td>
                                        <td>
                                            <select
                                                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", background: ["completed", "cancelled"].includes(order.status) ? "rgba(0,0,0,0.05)" : "white", cursor: ["completed", "cancelled", "delivered", "delivery_failed"].includes(order.status) ? "not-allowed" : "pointer", fontWeight: 600, color: "var(--as-text)" }}
                                                value={order.status}
                                                disabled={updating === order._id || ["completed", "cancelled", "delivered", "delivery_failed"].includes(order.status)}
                                                onChange={e => updateStatus(order._id, e.target.value)}
                                            >
                                                <option value={order.status} disabled>{st.label}</option>
                                                {STATUS_OPTS.filter(s => s.val !== order.status).map(s => (
                                                    <option key={s.val} value={s.val}>{s.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
