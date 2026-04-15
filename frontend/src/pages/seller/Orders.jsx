import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCommentDots, FaTimes, FaPaperPlane } from "react-icons/fa";
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

    // Chat states
    const [chatModal, setChatModal] = useState(null); // { buyerId, buyerName }
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        axiosClient.get(user.role === "admin" ? "/api/orders" : "/api/orders/seller-orders")
            .then(res => setOrders(res.data || []))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (chatModal) {
            axiosClient.get(`/api/chat/${chatModal.buyerId}`)
                .then(res => { setMessages(res.data || []); scrollToBottom(); })
                .catch(console.error);
        }
    }, [chatModal]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMsg.trim() || !chatModal) return;
        try {
            const res = await axiosClient.post("/api/chat", {
                receiverId: chatModal.buyerId,
                text: newMsg
            });
            setMessages(prev => [...prev, res.data]);
            setNewMsg("");
            scrollToBottom();
        } catch (err) {
            console.error("Gửi tin nhắn thất bại", err);
        }
    };

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
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                <select
                                                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", background: ["completed", "cancelled"].includes(order.status) ? "rgba(0,0,0,0.05)" : "white", cursor: ["completed", "cancelled", "delivered", "delivery_failed"].includes(order.status) ? "not-allowed" : "pointer", fontWeight: 600, color: "var(--as-text)", width: "100%" }}
                                                    value={order.status}
                                                    disabled={updating === order._id || ["completed", "cancelled", "delivered", "delivery_failed"].includes(order.status)}
                                                    onChange={e => updateStatus(order._id, e.target.value)}
                                                >
                                                    <option value={order.status} disabled>{st.label}</option>
                                                    {STATUS_OPTS.filter(s => s.val !== order.status).map(s => (
                                                        <option key={s.val} value={s.val}>{s.label}</option>
                                                    ))}
                                                </select>

                                                {user.role === "seller" && order.buyer && (
                                                    <button
                                                        className="as-btn as-btn-outline"
                                                        style={{ padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.85rem", width: "100%" }}
                                                        onClick={() => setChatModal({ buyerId: order.buyer._id || order.buyer, buyerName: order.shippingAddress?.fullName || "Khách hàng" })}
                                                    >
                                                        <FaCommentDots /> Nhắn tin
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Chat Modal */}
            {chatModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 450, display: "flex", flexDirection: "column", height: 500, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--as-border)", background: "var(--as-primary)", color: "white", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                            <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                <FaCommentDots size={18} /> Chat với {chatModal.buyerName}
                            </div>
                            <button onClick={() => setChatModal(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}><FaTimes size={16} /></button>
                        </div>

                        <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 12 }}>
                            {messages.length === 0 ? (
                                <div style={{ margin: "auto", color: "var(--as-text-muted)", fontSize: "0.9rem", textAlign: "center" }}>Chưa có tin nhắn nào.<br />Hãy gửi tin nhắn đầu tiên!</div>
                            ) : (
                                messages.map(m => {
                                    const isMe = m.sender === user._id;
                                    return (
                                        <div key={m._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                            <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 16, background: isMe ? "var(--as-primary)" : "white", color: isMe ? "white" : "var(--as-text)", border: isMe ? "none" : "1px solid var(--as-border)", fontSize: "0.95rem", lineHeight: 1.4, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                                                {m.text}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{ padding: 16, borderTop: "1px solid var(--as-border)", background: "white", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                            <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 12 }}>
                                <input
                                    style={{ flex: 1, padding: "10px 16px", borderRadius: 20, border: "1px solid var(--as-border)", outline: "none", background: "rgba(0,0,0,0.02)" }}
                                    placeholder="Nhập tin nhắn..."
                                    value={newMsg}
                                    onChange={e => setNewMsg(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="as-btn as-btn-primary" style={{ padding: "0 20px", borderRadius: 20, display: "flex", alignItems: "center", gap: 8 }} disabled={!newMsg.trim()}>
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
