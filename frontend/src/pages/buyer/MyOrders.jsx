import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaBox, FaChevronRight, FaShoppingBag, FaStore, FaCommentDots, FaPaperPlane, FaTimes } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import ShopeeFooter from "../../components/ShopeeFooter";

const STATUS_TABS = [
    { key: "all", label: "Tất cả" },
    { key: "pending_confirmation", label: "Chờ xác nhận" },
    { key: "confirmed", label: "Đã xác nhận" },
    { key: "shipping", label: "Đang giao" },
    { key: "completed", label: "Hoàn thành" },
    { key: "cancelled", label: "Đã hủy" },
];

const STATUS_LABELS = {
    pending_payment: { label: "Chờ thanh toán", cls: "badge-warning" },
    pending_confirmation: { label: "Chờ xác nhận", cls: "badge-warning" },
    paid: { label: "Đã thanh toán", cls: "badge-active" },
    confirmed: { label: "Đã xác nhận", cls: "badge-active" },
    shipping: { label: "Đang giao", cls: "badge-shipping" },
    delivered: { label: "Đã giao hàng", cls: "badge-shipping" },
    completed: { label: "Hoàn thành", cls: "badge-completed" },
    cancelled: { label: "Đã hủy", cls: "badge-cancelled" },
    delivery_failed: { label: "Giao thất bại", cls: "badge-cancelled" },
};

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

export default function MyOrders() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("all");

    // Chat
    const [chatModal, setChatModal] = useState(null); // { sellerId, shopName }
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        if (user.role === "seller" || user.role === "admin") {
            navigate("/home");
            return;
        }
        axiosClient.get("/api/orders/my")
            .then(res => setOrders(res.data || []))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, [user]);

    const handleCancelOrder = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
        try {
            await axiosClient.patch(`/api/orders/${id}/cancel`);
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status: "cancelled" } : o));
            alert("Đã hủy đơn hàng thành công!");
        } catch (err) {
            alert(err?.response?.data?.message || "Có lỗi xảy ra khi hủy đơn.");
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (chatModal) {
            axiosClient.get(`/api/chat/${chatModal.sellerId}`)
                .then(res => { setMessages(res.data || []); scrollToBottom(); })
                .catch(console.error);
        }
    }, [chatModal]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMsg.trim() || !chatModal) return;
        try {
            const res = await axiosClient.post("/api/chat", {
                receiverId: chatModal.sellerId,
                text: newMsg
            });
            setMessages(prev => [...prev, res.data]);
            setNewMsg("");
            scrollToBottom();
        } catch (err) {
            console.error("Gửi tin nhắn thất bại", err);
        }
    };

    const filtered = tab === "all" ? orders : orders.filter(o => o.status === tab);

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 60 }}>
            <div className="container" style={{ paddingTop: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
                    <FaShoppingBag style={{ color: "var(--primary)" }} /> Đơn mua của tôi
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
                    <div className="loading" style={{ padding: 60, textAlign: "center" }}>Đang tải danh sách đơn hàng...</div>
                ) : filtered.length === 0 ? (
                    <div className="card" style={{ padding: 80, textAlign: "center", borderRadius: 24, boxShadow: "var(--shadow-sm)", background: "#fff" }}>
                        <div style={{ fontSize: 64, marginBottom: 24 }}>📭</div>
                        <h2 style={{ marginBottom: 12 }}>Chưa có đơn hàng nào</h2>
                        <p style={{ color: "var(--text-light)", marginBottom: 32 }}>Hãy khám phá các sản phẩm độc đáo của chúng tôi nhé!</p>
                        <button className="btn btn-primary" onClick={() => navigate("/products")} style={{ padding: "12px 32px", borderRadius: 12 }}>Tiếp tục mua sắm</button>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {filtered.map(order => {
                            const st = STATUS_LABELS[order.status] || { label: order.status, cls: "badge-pending" };
                            return (
                                <div key={order._id} className="card" style={{ cursor: "pointer", padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)", transition: "transform 0.2s, box-shadow 0.2s" }} onClick={() => navigate(`/buyer/orders/${order._id}`)} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-lighter)", letterSpacing: "0.05em" }}>ĐƠN HÀNG #{order._id.slice(-8).toUpperCase()}</span>
                                            <span className={`badge-status ${st.cls}`} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8 }}>{st.label}</span>
                                        </div>
                                        <FaChevronRight size={14} color="var(--text-lighter)" />
                                    </div>

                                    {order.orderItems?.length > 0 && (
                                        <div style={{ padding: "12px 0", marginBottom: 20, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "var(--text-light)" }}>
                                                <FaStore /> {order.orderItems[0].seller?.sellerInfo?.shopName || order.orderItems[0].seller?.name || "Cửa hàng đối tác"}
                                                {new Set(order.orderItems.map(it => it.seller?._id || it.seller)).size > 1 && <span style={{ fontWeight: 400, color: "var(--text-lighter)", fontSize: 11 }}>(và đa dạng shop)</span>}
                                            </div>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8, gap: 6, borderColor: "var(--line)", color: "var(--primary)" }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setChatModal({
                                                        sellerId: order.orderItems[0].seller?._id || order.orderItems[0].seller,
                                                        shopName: order.orderItems[0].seller?.sellerInfo?.shopName || order.orderItems[0].seller?.name || "Cửa hàng"
                                                    });
                                                }}
                                            >
                                                <FaCommentDots /> Chat với Shop
                                            </button>
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
                                            <div style={{ fontSize: 13, color: "var(--text-lighter)", fontStyle: "italic", marginLeft: 84 }}>... và {order.orderItems.length - 2} sản phẩm khác</div>
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
                                                    Hủy đơn hàng
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: 12, color: "var(--text-lighter)", marginBottom: 2 }}>Thành tiền</div>
                                            <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: 20 }}>{fmt(order.totalPrice)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Chat Modal */}
            {chatModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 450, display: "flex", flexDirection: "column", height: 500, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", background: "var(--primary)", color: "white", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                            <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                <FaStore /> {chatModal.shopName}
                            </div>
                            <button onClick={() => setChatModal(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}><FaTimes size={16} /></button>
                        </div>

                        <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 12 }}>
                            {messages.length === 0 ? (
                                <div style={{ margin: "auto", color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center" }}>Bắt đầu cuộc trò chuyện với Shop.<br />Tin nhắn của bạn sẽ được trả lời sớm nhất.</div>
                            ) : (
                                messages.map(m => {
                                    const isMe = user && m.sender === user._id;
                                    return (
                                        <div key={m._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                            <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 16, background: isMe ? "var(--primary)" : "white", color: isMe ? "white" : "var(--text)", border: isMe ? "none" : "1px solid var(--line)", fontSize: "0.95rem", lineHeight: 1.4, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                {m.text}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "white", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                            <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 12 }}>
                                <input
                                    style={{ flex: 1, padding: "10px 16px", borderRadius: 20, border: "1px solid var(--line)", outline: "none", background: "rgba(0,0,0,0.02)" }}
                                    placeholder="Nhập tin nhắn..."
                                    value={newMsg}
                                    onChange={e => setNewMsg(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-primary" style={{ padding: "0 20px", borderRadius: 20, display: "flex", alignItems: "center", gap: 8 }} disabled={!newMsg.trim()}>
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            <ShopeeFooter />

        </div>
    );
}
