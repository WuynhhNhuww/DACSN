import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaBox, FaArrowLeft, FaCheck, FaStore, FaCommentDots, FaStar, FaCreditCard, FaTruck, FaExclamationTriangle, FaTimes, FaPaperPlane } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import ShopeeFooter from "../../components/ShopeeFooter";

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

const STATUS_LABELS = {
    pending_payment: "Chờ thanh toán",
    pending_confirmation: "Chờ xác nhận",
    paid: "Đã thanh toán",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    delivered: "Đã giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    delivery_failed: "Giao thất bại"
};

const TIMELINE_STEPS = ["pending_confirmation", "shipping", "delivered", "completed"];

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", image: "" });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    // Complaint States
    const [showComplaint, setShowComplaint] = useState(false);
    const [complaintForm, setComplaintForm] = useState({ reason: "Hàng lỗi / Không hoạt động", description: "", evidenceImage: "" });
    const [complaintSubmitting, setComplaintSubmitting] = useState(false);
    const [myComplaint, setMyComplaint] = useState(null);

    // Chat States
    const [chatTarget, setChatTarget] = useState(null); // { shopId, shopName }
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchOrderAndComplaint = async () => {
            try {
                const resOrder = await axiosClient.get(`/api/orders/${id}`);
                setOrder(resOrder.data);

                try {
                    const resCmp = await axiosClient.get("/api/complaints");
                    const found = resCmp.data?.find(c => c.order?._id === id || c.order === id);
                    if (found) setMyComplaint(found);
                } catch (e) { console.error("Lỗi lấy complaint", e); }
            } catch (err) {
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };
        fetchOrderAndComplaint();
    }, [id]);

    // Chat Polling
    useEffect(() => {
        let interval;
        if (chatTarget) {
            const fetchMsg = () => {
                axiosClient.get(`/api/chat/${chatTarget.shopId}`)
                    .then(res => setMessages(res.data))
                    .catch(() => { });
            };
            fetchMsg();
            interval = setInterval(fetchMsg, 5000); // pull every 5s
        }
        return () => clearInterval(interval);
    }, [chatTarget]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !chatTarget) return;
        try {
            const res = await axiosClient.post("/api/chat", { receiverId: chatTarget.shopId, text: chatInput });
            setMessages(prev => [...prev, res.data]);
            setChatInput("");
        } catch (err) {
            alert("Lỗi gửi tin nhắn");
        }
    };

    const handleReviewSubmit = async (e, productId) => {
        e.preventDefault();

        console.log("Submitting review:", {
            productId,
            rating: reviewForm.rating,
            comment: reviewForm.comment
        });

        setReviewSubmitting(true);
        try {
            await axiosClient.post("/api/reviews", {
                productId,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
                images: reviewForm.image ? [reviewForm.image] : []
            });

            alert("Cảm ơn bạn đã đánh giá!");
            setReviewing(null);
            setReviewForm({ rating: 5, comment: "", image: "" });
        } catch (err) {
            console.error("Review submit error:", err.response?.data || err);
            alert(err?.response?.data?.message || "Lỗi khi gửi đánh giá.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleReviewImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) return alert("File ảnh quá lớn, vui lòng chọn file dưới 2MB.");
            const reader = new FileReader();
            reader.onloadend = () => {
                setReviewForm(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
        try {
            await axiosClient.patch(`/api/orders/${id}/cancel`);
            setOrder({ ...order, status: "cancelled" });
            alert("Đã hủy đơn hàng thành công!");
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi khi hủy đơn hàng.");
        }
    };

    const handlePayNow = async () => {
        try {
            const res = await axiosClient.post(`/api/orders/${id}/vnpay-create`);
            if (res.data.paymentUrl) {
                window.location.href = res.data.paymentUrl;
            }
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi khi tạo liên kết thanh toán.");
        }
    };

    const handlePayNowMomo = async () => {
        try {
            const res = await axiosClient.post(`/api/orders/${id}/momo-create`);
            if (res.data.paymentUrl) {
                window.location.href = res.data.paymentUrl;
            }
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi khi tạo liên kết MoMo.");
        }
    };

    const handleConfirmReceipt = async () => {
        if (!window.confirm("Bạn xác nhận đã nhận được hàng và hàng còn nguyên vẹn?")) return;
        try {
            const res = await axiosClient.put(`/api/orders/${id}/confirm-receipt`);
            setOrder(res.data);
            alert("Cảm ơn bạn đã mua hàng!");
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi xác nhận.");
        }
    };

    const handleComplaintSubmit = async (e) => {
        e.preventDefault();
        setComplaintSubmitting(true);
        try {
            const res = await axiosClient.post("/api/complaints", {
                orderId: id,
                reason: complaintForm.reason,
                description: complaintForm.description,
                evidenceImages: complaintForm.evidenceImage ? [complaintForm.evidenceImage] : []
            });
            alert("Đã gửi yêu cầu khiếu nại thành công.");
            setMyComplaint(res.data);
            setShowComplaint(false);
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi khi gửi yêu cầu.");
        } finally {
            setComplaintSubmitting(false);
        }
    };

    const handleComplaintDecision = async (accepted) => {
        try {
            const res = await axiosClient.put(`/api/complaints/${myComplaint._id}/buyer-respond`, { accepted });
            setMyComplaint(res.data);
            alert(accepted ? "Đã chấp nhận mức đền bù." : "Đã chuyển lên cho Admin giải quyết.");
        } catch (err) {
            alert(err?.response?.data?.message || "Có lỗi xảy ra.");
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                return alert("File ảnh quá lớn, vui lòng chọn file dưới 2MB.");
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setComplaintForm({ ...complaintForm, evidenceImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const groupedItems = order ? (() => {
        const groups = {};
        (order.orderItems || []).forEach(it => {
            const shopId = it.seller?._id || it.seller || "unknown";
            if (!groups[shopId]) {
                groups[shopId] = {
                    shopId,
                    shopName: it.seller?.sellerInfo?.shopName || "Cửa hàng đối tác",
                    items: []
                };
            }
            groups[shopId].items.push(it);
        });
        return Object.values(groups);
    })() : [];

    const getTimelineStepIndex = (status) => {
        if (status === "cancelled" || status === "delivery_failed") return -1;
        if (status === "pending_payment") return 0;
        if (status === "confirmed") return 1;
        const idx = TIMELINE_STEPS.indexOf(status);
        return idx !== -1 ? idx : 0;
    };
    const currentStepIdx = order ? getTimelineStepIndex(order.status) : -1;

    if (loading) return <div className="loading" style={{ marginTop: 60, textAlign: "center" }}>Đang tải chi tiết đơn hàng...</div>;
    if (!order) return <div className="card" style={{ marginTop: 80, padding: 60, textAlign: "center", borderRadius: 24 }}><h3 style={{ marginBottom: 12 }}>Không tìm thấy đơn hàng</h3><button className="btn btn-primary" onClick={() => navigate("/buyer/orders")}>Về danh sách đơn</button></div>;

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 80 }}>
            <div className="container" style={{ paddingTop: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
                    <button className="btn" style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-light)" }} onClick={() => navigate("/buyer/orders")}><FaArrowLeft /></button>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Chi tiết Đơn hàng</h1>
                </div>

                {order.status !== "cancelled" && order.status !== "delivery_failed" && (
                    <div className="card" style={{ padding: "40px 20px", borderRadius: 24, marginBottom: 24, background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", maxWidth: 800, margin: "0 auto" }}>
                            <div style={{ position: "absolute", top: 20, left: 0, right: 0, height: 4, background: "var(--line)", zIndex: 0 }}>
                                <div style={{ height: "100%", background: "var(--primary)", width: `${Math.max(0, currentStepIdx) * 33.33}%`, transition: "width 0.3s" }} />
                            </div>
                            {["Chờ xác nhận", "Đang giao", "Đã giao", "Hoàn thành"].map((lbl, idx) => (
                                <div key={lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 1, width: 80 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: idx <= currentStepIdx ? "var(--primary)" : "#fff", color: idx <= currentStepIdx ? "#fff" : "var(--text-light)", border: `2px solid ${idx <= currentStepIdx ? "var(--primary)" : "var(--line)"}`, transition: "all 0.3s" }}>
                                        <FaCheck />
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: idx <= currentStepIdx ? "var(--primary)" : "var(--text-light)", textAlign: "center" }}>{lbl}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="card" style={{ marginBottom: 24, padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)", paddingBottom: 24, marginBottom: 24 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-lighter)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Mã đơn: #{order._id.slice(-8).toUpperCase()}</div>
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
                                        Hủy đơn hàng
                                    </button>
                                )}
                                {order.status === "pending_payment" && order.paymentMethod === "VNPAY" && (
                                    <button
                                        onClick={handlePayNow}
                                        className="btn btn-primary"
                                        style={{ border: "none", fontSize: 12, padding: "6px 16px", borderRadius: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                                    >
                                        <FaCreditCard /> Thanh toán ngay (VNPay)
                                    </button>
                                )}
                                {order.status === "pending_payment" && order.paymentMethod === "MOMO" && (
                                    <button
                                        onClick={handlePayNowMomo}
                                        className="btn btn-primary"
                                        style={{ border: "none", fontSize: 12, padding: "6px 16px", borderRadius: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, background: "#ae2070" }}
                                    >
                                        <FaCreditCard /> Thanh toán ngay (MoMo)
                                    </button>
                                )}
                                {order.status === "delivered" && (
                                    <button
                                        onClick={handleConfirmReceipt}
                                        className="btn"
                                        style={{ background: "#10b981", border: "none", color: "#fff", fontSize: 12, padding: "6px 16px", borderRadius: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                                    >
                                        <FaCheck /> Đã nhận được hàng
                                    </button>
                                )}
                                {["delivered", "completed"].includes(order.status) && !myComplaint && (
                                    <button
                                        onClick={() => setShowComplaint(true)}
                                        className="btn"
                                        style={{ background: "#fff", border: "1px solid #f43f5e", color: "#f43f5e", fontSize: 12, padding: "6px 16px", borderRadius: 8, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
                                    >
                                        <FaExclamationTriangle /> Khiếu nại / Trả hàng
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 13, color: "var(--text-lighter)", marginBottom: 8 }}>Cần thanh toán</div>
                            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--primary)" }}>{fmt(order.totalPrice)}</div>
                        </div>
                    </div>

                    {/* HIỂN THỊ TIẾN TRÌNH KHIẾU NẠI NẾU CÓ */}
                    {myComplaint && (
                        <div style={{ background: "rgba(244, 63, 94, 0.05)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <FaExclamationTriangle color="#f43f5e" size={20} />
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f43f5e", margin: 0 }}>Tiến trình Khiếu nại</h3>
                            </div>
                            <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>
                                <p><strong>Lý do:</strong> {myComplaint.reason}</p>
                                <p style={{ marginBottom: 12 }}><strong>Trạng thái:</strong> <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                                    {myComplaint.status === "open" ? "Đang chờ Shop phản hồi..." :
                                        myComplaint.status === "seller_processing" ? "Shop đã đưa ra phương án đền bù" :
                                            myComplaint.status === "escalated" ? "Đang chờ Admin can thiệp xử lý" :
                                                myComplaint.status === "resolved" ? "Đã giải quyết hoàn tất" : "Bị từ chối"}
                                </span></p>

                                {myComplaint.status === "seller_processing" && (
                                    <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid var(--line)", marginTop: 16 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Phản hồi từ Shop:</div>
                                        <div style={{ color: "var(--text-light)", marginBottom: 12 }}>{myComplaint.sellerResponse}</div>

                                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Shop đề xuất đền bù:</div>
                                        <div style={{ color: "var(--primary)", fontSize: 20, fontWeight: 800, marginBottom: 16 }}>{fmt(myComplaint.proposedRefundAmount)}</div>

                                        <p style={{ fontSize: 12, color: "var(--text-lighter)", marginBottom: 12 }}>Vui lòng quyết định khoản bồi thường này. Nếu từ chối, khiếu nại sẽ chuyển cho Admin giải quyết.</p>

                                        <div style={{ display: "flex", gap: 12 }}>
                                            <button onClick={() => handleComplaintDecision(true)} className="btn btn-primary" style={{ padding: "8px 20px", borderRadius: 8, fontWeight: 700 }}>Chấp nhận & Hoàn tất</button>
                                            <button onClick={() => handleComplaintDecision(false)} className="btn btn-outline" style={{ padding: "8px 20px", borderRadius: 8, fontWeight: 700 }}>Từ chối & Gọi Admin can thiệp</button>
                                        </div>
                                    </div>
                                )}

                                {myComplaint.status === "resolved" && (
                                    <div style={{ background: "#10b98115", border: "1px solid #10b981", color: "#065f46", padding: 16, borderRadius: 12, marginTop: 16, fontWeight: 500 }}>
                                        Phán quyết cuối cùng: <strong>{myComplaint.resolution === "buyer_wins" ? "Bạn (Người Mua) thắng kiện" : "Shop thắng kiện"}</strong>
                                        <br />
                                        Số tiền đền bù được nhận: <span style={{ fontWeight: 800 }}>{fmt(myComplaint.refundAmount)}</span>
                                        {myComplaint.adminNote && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Ghi chú: {myComplaint.adminNote}</div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                                <FaTruck style={{ color: "var(--primary)" }} /> Địa chỉ nhận hàng
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
                                <FaCreditCard style={{ color: "var(--primary)" }} /> Thông tin thanh toán
                            </h3>
                            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: "var(--text-light)" }}>Hình thức</span>
                                    <span style={{ fontWeight: 600 }}>{order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng" : "Thanh toán Online"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: "var(--text-light)" }}>Tổng tiền hàng</span>
                                    <span style={{ fontWeight: 600 }}>{fmt(order.itemsPrice || (order.totalPrice - (order.shippingFee || 0) + (order.discountAmount || 0)))}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ color: "var(--text-light)" }}>Phí vận chuyển</span>
                                    <span style={{ fontWeight: 600 }}>{fmt(order.shippingFee || 0)}</span>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981", fontWeight: 600 }}>
                                        <span>Khuyến mãi</span>
                                        <span>-{fmt(order.discountAmount)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                        <FaBox style={{ color: "var(--primary)" }} /> Sản phẩm đã mua
                    </h3>
                    {groupedItems.map((group, groupIdx) => (
                        <div key={group.shopId} style={{ marginBottom: groupIdx === groupedItems.length - 1 ? 0 : 32, borderBottom: groupIdx === groupedItems.length - 1 ? "none" : "1px solid var(--line)", paddingBottom: groupIdx === groupedItems.length - 1 ? 0 : 24 }}>
                            <div style={{ fontWeight: 700, padding: "8px 0", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <FaStore style={{ color: "var(--text-lighter)" }} /> {group.shopName}
                                </div>
                                <button className="btn" onClick={() => setChatTarget({ shopId: group.shopId, shopName: group.shopName })} style={{ background: "var(--primary-light)", color: "var(--primary)", border: "none", fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8 }}>Chat với Người Bán</button>
                            </div>
                            {group.items.map(item => {
                                const productId =
                                    typeof item.product === "object"
                                        ? item.product?._id
                                        : item.product;

                                return (
                                    <div key={item._id} style={{ marginBottom: 20 }}>
                                        <div style={{ display: "flex", gap: 20 }}>
                                            <div style={{ width: 80, height: 80, borderRadius: 16, background: "#f8fafc", overflow: "hidden", flexShrink: 0, border: "1px solid #f1f5f9" }}>
                                                {item.image ? (
                                                    <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <span style={{ fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.2 }}>📦</span>
                                                )}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "var(--text)" }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ fontSize: 14, color: "var(--text-light)" }}>
                                                    SL: {item.qty}
                                                </div>
                                            </div>

                                            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 10 }}>
                                                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
                                                    {fmt(item.unitPrice)}
                                                </div>

                                                {(order.status === "completed" || order.status === "delivered") && productId && (
                                                    <button
                                                        className="btn"
                                                        style={{
                                                            background: "var(--primary)",
                                                            color: "#fff",
                                                            border: "none",
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            padding: "6px 12px",
                                                            borderRadius: 8,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 6
                                                        }}
                                                        onClick={() => {
                                                            const pId = String(productId);
                                                            if (String(reviewing) === pId) {
                                                                setReviewing(null);
                                                            } else {
                                                                setReviewing(pId);
                                                                setReviewForm({ rating: 5, comment: "", image: "" });
                                                            }
                                                        }}
                                                    >
                                                        <FaCommentDots /> Đánh giá sản phẩm
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {String(reviewing) === String(productId) && (
                                            <form
                                                onSubmit={(e) => handleReviewSubmit(e, productId)}
                                                style={{
                                                    marginTop: 24,
                                                    background: "var(--primary-light)",
                                                    padding: 24,
                                                    borderRadius: 20,
                                                    border: "1px solid rgba(79, 70, 229, 0.1)"
                                                }}
                                            >
                                                <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                                                    <FaStar style={{ color: "var(--primary)" }} /> Đánh giá: {item.name}
                                                </div>

                                                <div className="formGroup" style={{ marginBottom: 16 }}>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", marginBottom: 8, display: "block" }}>
                                                        Chất lượng (Sao)
                                                    </label>
                                                    <select
                                                        className="formControl"
                                                        style={{ width: 140, borderRadius: 12 }}
                                                        value={reviewForm.rating}
                                                        onChange={(e) =>
                                                            setReviewForm({
                                                                ...reviewForm,
                                                                rating: Number(e.target.value)
                                                            })
                                                        }
                                                    >
                                                        {[5, 4, 3, 2, 1].map((n) => (
                                                            <option key={n} value={n}>
                                                                {n} Sao {n === 5 ? "⭐" : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="formGroup" style={{ marginBottom: 16 }}>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", marginBottom: 8, display: "block" }}>
                                                        Viết nhận xét của bạn
                                                    </label>
                                                    <textarea
                                                        className="formControl"
                                                        rows={3}
                                                        style={{ borderRadius: 12 }}
                                                        placeholder="Hãy chia sẻ trải nghiệm của bạn về sản phẩm này nhé..."
                                                        value={reviewForm.comment}
                                                        onChange={(e) =>
                                                            setReviewForm({
                                                                ...reviewForm,
                                                                comment: e.target.value
                                                            })
                                                        }
                                                        required
                                                    />
                                                </div>

                                                <div className="formGroup" style={{ marginBottom: 24 }}>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", marginBottom: 8, display: "block" }}>
                                                        Thêm hình ảnh (Tùy chọn)
                                                    </label>
                                                    <input type="file" accept="image/*" onChange={handleReviewImageUpload} style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 12 }} />
                                                    {reviewForm.image && (
                                                        <div style={{ marginTop: 12, position: "relative", width: "fit-content" }}>
                                                            <img src={reviewForm.image} alt="Preview" style={{ height: 100, borderRadius: 8, objectFit: "cover", border: "1px solid var(--line)" }} />
                                                            <button type="button" onClick={() => setReviewForm(prev => ({...prev, image: ""}))} style={{ position: "absolute", top: -8, right: -8, background: "#f43f5e", color: "white", border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>✕</button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ display: "flex", gap: 12 }}>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        style={{ padding: "10px 24px", borderRadius: 10, fontWeight: 700 }}
                                                        disabled={reviewSubmitting}
                                                    >
                                                        {reviewSubmitting ? "Đang gửi..." : "Gửi Đánh Giá"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn"
                                                        style={{
                                                            padding: "10px 24px",
                                                            borderRadius: 10,
                                                            fontWeight: 700,
                                                            background: "#fff",
                                                            border: "1px solid var(--line)"
                                                        }}
                                                        onClick={() => setReviewing(null)}
                                                    >
                                                        Hủy
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            <ShopeeFooter />

            {/* Khiếu Nại Modal */}
            {showComplaint && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                    <div style={{ background: "#fff", padding: 32, borderRadius: 24, width: "100%", maxWidth: 500 }}>
                        <h2 style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}><FaExclamationTriangle color="#f43f5e" /> Yêu cầu Trả hàng / Hoàn tiền</h2>
                        <form onSubmit={handleComplaintSubmit}>
                            <div className="formGroup" style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Lý do</label>
                                <select className="formControl" value={complaintForm.reason} onChange={e => setComplaintForm({ ...complaintForm, reason: e.target.value })}>
                                    <option>Hàng lỗi / Không hoạt động</option>
                                    <option>Thiếu hàng / Mất hàng</option>
                                    <option>Khác với mô tả</option>
                                    <option>Hàng giả / Nhái</option>
                                </select>
                            </div>
                            <div className="formGroup" style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Mô tả chi tiết</label>
                                <textarea className="formControl" rows={4} required placeholder="Mô tả cụ thể vấn đề bạn gặp phải..." value={complaintForm.description} onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })}></textarea>
                            </div>
                            <div className="formGroup" style={{ marginBottom: 24 }}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 700 }}>Ảnh bằng chứng (Tùy chọn)</label>
                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 12 }} />
                                {complaintForm.evidenceImage && (
                                    <div style={{ marginTop: 12 }}>
                                        <img src={complaintForm.evidenceImage} alt="Preview" style={{ height: 100, borderRadius: 8, objectFit: "cover", border: "1px solid var(--line)" }} />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
                                <button type="button" className="btn" onClick={() => setShowComplaint(false)} style={{ background: "#f1f5f9", padding: "10px 24px", borderRadius: 12, fontWeight: 700 }}>Hủy</button>
                                <button type="submit" className="btn btn-primary" disabled={complaintSubmitting} style={{ padding: "10px 24px", borderRadius: 12, fontWeight: 700, background: "#f43f5e" }}>Gửi Yêu Cầu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Chat Widget */}
            {chatTarget && (
                <div style={{ position: "fixed", bottom: 20, right: 20, width: 340, background: "#fff", borderRadius: 24, boxShadow: "var(--shadow-lg)", zIndex: 999, display: "flex", flexDirection: "column", border: "1px solid var(--line)", overflow: "hidden" }}>
                    <div style={{ background: "var(--primary)", color: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><FaStore /> {chatTarget.shopName}</div>
                        <button onClick={() => setChatTarget(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><FaTimes size={16} /></button>
                    </div>
                    <div style={{ height: 300, overflowY: "auto", padding: 16, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 12 }}>
                        {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--text-lighter)", fontSize: 13, marginTop: 20 }}>Bắt đầu trò chuyện với Người Bán</div>}
                        {messages.map(msg => (
                            <div key={msg._id} style={{ alignSelf: msg.sender === user._id ? "flex-end" : "flex-start", background: msg.sender === user._id ? "var(--primary)" : "#fff", color: msg.sender === user._id ? "#fff" : "var(--text)", padding: "10px 16px", borderRadius: 20, borderBottomRightRadius: msg.sender === user._id ? 4 : 20, borderBottomLeftRadius: msg.sender !== user._id ? 4 : 20, fontSize: 14, maxWidth: "80%", boxShadow: "var(--shadow-sm)" }}>
                                {msg.text}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} style={{ display: "flex", padding: 12, borderTop: "1px solid var(--line)", background: "#fff" }}>
                        <input type="text" placeholder="Nhập tin nhắn..." value={chatInput} onChange={e => setChatInput(e.target.value)} style={{ flex: 1, border: "none", background: "#f1f5f9", padding: "10px 16px", borderRadius: 20, outline: "none", fontSize: 14 }} />
                        <button type="submit" disabled={!chatInput.trim()} style={{ background: "var(--primary)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 8, cursor: chatInput.trim() ? "pointer" : "not-allowed", opacity: chatInput.trim() ? 1 : 0.5 }}>
                            <FaPaperPlane size={14} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
