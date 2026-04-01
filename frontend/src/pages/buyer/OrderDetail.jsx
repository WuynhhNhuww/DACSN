import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaBox, FaArrowLeft, FaCheck, FaStore, FaCommentDots, FaStar, FaCreditCard, FaTruck } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import ShopeeFooter from "../../components/ShopeeFooter";

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

const STATUS_LABELS = {
    pending_payment: "To Pay",
    pending_confirmation: "To Confirm",
    paid: "Paid",
    confirmed: "Confirmed",
    shipping: "Shipping",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    delivery_failed: "Failed"
};

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    useEffect(() => {
        axiosClient.get(`/api/orders/${id}`)
            .then(res => setOrder(res.data))
            .catch(() => setOrder(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleReviewSubmit = async (e, productId) => {
        e.preventDefault();
        setReviewSubmitting(true);
        try {
            await axiosClient.post("/api/reviews", {
                productId,
                rating: reviewForm.rating,
                comment: reviewForm.comment
            });
            alert("Thank you for your feedback!");
            setReviewing(null);
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi khi gửi đánh giá.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            await axiosClient.patch(`/api/orders/${id}/cancel`);
            setOrder({ ...order, status: "cancelled" });
            alert("Order cancelled successfully!");
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi khi hủy đơn hàng.");
        }
    };

    const groupedItems = order ? (() => {
        const groups = {};
        (order.orderItems || []).forEach(it => {
            const shopId = it.seller?._id || it.seller || "unknown";
            if (!groups[shopId]) {
                groups[shopId] = {
                    shopId,
                    shopName: it.seller?.sellerInfo?.shopName || "WPN Partner",
                    items: []
                };
            }
            groups[shopId].items.push(it);
        });
        return Object.values(groups);
    })() : [];

    if (loading) return <div className="loading" style={{ marginTop: 60, textAlign: "center" }}>Loading details...</div>;
    if (!order) return <div className="card" style={{ marginTop: 80, padding: 60, textAlign: "center", borderRadius: 24 }}><h3 style={{ marginBottom: 12 }}>Order not found</h3><button className="btn btn-primary" onClick={() => navigate("/buyer/orders")}>Back to Orders</button></div>;

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 80 }}>
            <div className="container" style={{ paddingTop: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
                    <button className="btn" style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-light)" }} onClick={() => navigate("/buyer/orders")}><FaArrowLeft /></button>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Order Details</h1>
                </div>

                <div className="card" style={{ marginBottom: 24, padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)", paddingBottom: 24, marginBottom: 24 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-lighter)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Order ID: #{order._id.slice(-8).toUpperCase()}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>
                                    {STATUS_LABELS[order.status] || order.status}
                                </span>
                                {["pending_payment", "pending_confirmation"].includes(order.status) && (
                                    <button
                                        onClick={handleCancelOrder}
                                        className="btn"
                                        style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--accent)", border: "none", fontSize: 12, padding: "6px 16px", borderRadius: 8, fontWeight: 700 }}
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 13, color: "var(--text-lighter)", marginBottom: 8 }}>Final Payment</div>
                            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--primary)" }}>{fmt(order.totalPrice)}</div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                                <FaTruck style={{ color: "var(--primary)" }} /> Shipping Address
                            </h3>
                            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "var(--text)" }}>{order.shippingAddress?.fullName}</div>
                                <div style={{ color: "var(--text-light)", marginBottom: 4, fontWeight: 500 }}>{order.shippingAddress?.phone}</div>
                                <div style={{ color: "var(--text-light)" }}>
                                    {order.shippingAddress?.detail}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                                <FaCreditCard style={{ color: "var(--primary)" }} /> Payment Info
                            </h3>
                            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: "var(--text-light)" }}>Method</span>
                                    <span style={{ fontWeight: 600 }}>{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: "var(--text-light)" }}>Subtotal</span>
                                    <span style={{ fontWeight: 600 }}>{fmt(order.itemsPrice || (order.totalPrice - (order.shippingFee || 0) + (order.discountAmount || 0)))}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: "var(--text-light)" }}>Delivery Fee</span>
                                    <span style={{ fontWeight: 600 }}>{fmt(order.shippingFee || 0)}</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981", fontWeight: 600 }}>
                                        <span>Total Discount</span>
                                        <span>-{fmt(order.discountAmount)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                        <FaBox style={{ color: "var(--primary)" }} /> Purchased Items
                    </h3>
                    {groupedItems.map((group, groupIdx) => (
                        <div key={group.shopId} style={{ marginBottom: groupIdx === groupedItems.length - 1 ? 0 : 32, borderBottom: groupIdx === groupedItems.length - 1 ? "none" : "1px solid var(--line)", paddingBottom: groupIdx === groupedItems.length - 1 ? 0 : 24 }}>
                            <div style={{ fontWeight: 700, padding: "8px 0", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <FaStore style={{ color: "var(--text-lighter)" }} /> {group.shopName}
                                </div>
                                <button className="btn" style={{ background: "var(--primary-light)", color: "var(--primary)", border: "none", fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8 }}>Chat with Seller</button>
                            </div>
                            {group.items.map(item => (
                                <div key={item._id} style={{ marginBottom: 20 }}>
                                    <div style={{ display: "flex", gap: 20 }}>
                                        <div style={{ width: 80, height: 80, borderRadius: 16, background: "#f8fafc", overflow: "hidden", flexShrink: 0, border: "1px solid #f1f5f9" }}>
                                            {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.2 }}>📦</span>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "var(--text)" }}>{item.name}</div>
                                            <div style={{ fontSize: 14, color: "var(--text-light)" }}>Qty: {item.qty}</div>
                                        </div>
                                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>{fmt(item.unitPrice)}</div>
                                            {order.status === "completed" && (
                                                <button
                                                    className="btn"
                                                    style={{ background: "var(--primary)", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}
                                                    onClick={() => setReviewing(reviewing === item.product?._id || item.product ? null : (item.product?._id || item.product))}
                                                >
                                                    <FaCommentDots /> Review Product
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Review Form Inline */}
                                    {reviewing === (item.product?._id || item.product) && (
                                        <form
                                            onSubmit={(e) => handleReviewSubmit(e, (item.product?._id || item.product))}
                                            style={{ marginTop: 24, background: "var(--primary-light)", padding: 24, borderRadius: 20, border: "1px solid rgba(79, 70, 229, 0.1)" }}
                                        >
                                            <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                                                <FaStar style={{ color: "var(--primary)" }} /> Review: {item.name}
                                            </div>
                                            <div className="formGroup" style={{ marginBottom: 16 }}>
                                                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", marginBottom: 8, display: "block" }}>Rating</label>
                                                <select className="formControl" style={{ width: 140, borderRadius: 12 }} value={reviewForm.rating} onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                                                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars {n === 5 ? "⭐" : ""}</option>)}
                                                </select>
                                            </div>
                                            <div className="formGroup" style={{ marginBottom: 16 }}>
                                                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", marginBottom: 8, display: "block" }}>Your Comment</label>
                                                <textarea
                                                    className="formControl" rows={3} style={{ borderRadius: 12 }} placeholder="What did you like or dislike about this product?"
                                                    value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div style={{ display: "flex", gap: 12 }}>
                                                <button type="submit" className="btn btn-primary" style={{ padding: "10px 24px", borderRadius: 10, fontWeight: 700 }} disabled={reviewSubmitting}>Submit Review</button>
                                                <button type="button" className="btn" style={{ padding: "10px 24px", borderRadius: 10, fontWeight: 700, background: "#fff", border: "1px solid var(--line)" }} onClick={() => setReviewing(null)}>Cancel</button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <ShopeeFooter />
        </div>
    );
}
