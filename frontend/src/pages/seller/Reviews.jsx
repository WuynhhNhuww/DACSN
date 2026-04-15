import { useState, useEffect, useContext } from "react";
import { FaReply, FaStar, FaStore } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

export default function SellerReviews() {
    const { user } = useContext(AuthContext) || {};
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(null); // id of review
    const [responseMsg, setResponseMsg] = useState("");

    useEffect(() => {
        if (!user) return;
        loadReviews();
    }, [user]);

    const loadReviews = async () => {
        try {
            const res = await axiosClient.get("/api/reviews/seller");
            setReviews(res.data || []);
        } catch (error) {
            console.error("Lỗi tải đánh giá:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id) => {
        if (!responseMsg.trim()) return alert("Vui lòng nhập phản hồi.");

        try {
            await axiosClient.put(`/api/reviews/${id}/reply`, {
                reply: responseMsg,
            });
            setResponding(null);
            setResponseMsg("");
            loadReviews();
            alert("Đã gửi phản hồi thành công");
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi khi phản hồi");
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Quản lý Đánh giá</h1>
            </div>

            <div className="as-card" style={{ padding: 24 }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: 40 }}>Đang tải dữ liệu...</div>
                ) : reviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, color: "var(--as-text-muted)" }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>⭐</div>
                        <h3>Chưa có đánh giá nào</h3>
                        <p>Sản phẩm của bạn chưa có đánh giá từ khách hàng!</p>
                    </div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th style={{ width: "20%" }}>Khách hàng</th>
                                <th style={{ width: "20%" }}>Sản phẩm</th>
                                <th style={{ width: "40%" }}>Nội dung Đánh giá</th>
                                <th style={{ width: "20%" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(r => (
                                <tr key={r._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{r.buyer?.name || "Người mua ẩn danh"}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)" }}>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</div>
                                    </td>
                                    <td>
                                        {r.product ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                {r.product.images?.[0] ? (
                                                    <img src={r.product.images[0]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                                                ) : (
                                                    <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f8fafc", flexShrink: 0 }} />
                                                )}
                                                <div style={{ fontSize: "0.9rem", fontWeight: 600, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                    {r.product.name}
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ color: "var(--as-text-muted)" }}>Sản phẩm đã bị xóa</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ color: "#fbbf24", marginBottom: 6, fontSize: 13 }}>
                                            {Array(5).fill(0).map((_, i) => <FaStar key={i} style={{ opacity: i < (r.stars || r.rating) ? 1 : 0.3 }} />)}
                                        </div>
                                        <div style={{ fontSize: "0.95rem", color: "var(--text)" }}>{r.comment || <span style={{ fontStyle: "italic", color: "var(--as-text-muted)" }}>Không có bình luận chữ</span>}</div>
                                        
                                        {r.images && r.images.length > 0 && (
                                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                                {r.images.map((img, idx) => (
                                                    <img key={idx} src={img} alt="review evidence" style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 6, border: "1px solid var(--line)" }} />
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {r.sellerReply ? (
                                            <div style={{ fontSize: "0.85rem", background: "rgba(79, 70, 229, 0.05)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(79, 70, 229, 0.1)" }}>
                                                <div style={{ fontWeight: 700, color: "var(--as-primary)", marginBottom: 4 }}><FaStore size={10} /> Shop phản hồi:</div>
                                                <div style={{ color: "var(--text)", lineHeight: 1.5 }}>{r.sellerReply}</div>
                                            </div>
                                        ) : (
                                            <button className="as-btn as-btn-primary as-btn-sm" onClick={() => setResponding(r._id)}>
                                                <FaReply style={{ marginRight: 6 }} /> Trả lời
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {responding && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "white", padding: 32, borderRadius: 16, width: 500 }}>
                        <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><FaReply /> Phản hồi Đánh giá</h3>
                        <p style={{ fontSize: "0.9rem", color: "var(--as-text-muted)", marginBottom: 16 }}>Phản hồi của bạn sẽ được hiển thị công khai trên trang sản phẩm.</p>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Nội dung phản hồi</label>
                            <textarea
                                className="as-input"
                                style={{ width: "100%", height: 120, resize: "none" }}
                                placeholder="Cảm ơn bạn đã mua hàng..."
                                value={responseMsg}
                                onChange={e => setResponseMsg(e.target.value)}
                            />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                            <button className="as-btn as-btn-outline" onClick={() => { setResponding(null); setResponseMsg(""); }}>Hủy</button>
                            <button className="as-btn as-btn-primary" onClick={() => handleRespond(responding)}>Gửi Trả Lời</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
