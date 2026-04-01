import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function AdminBanners() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("pending");

    const [reviewModal, setReviewModal] = useState({ show: false, banner: null, fee: 100000, rejectReason: "", type: "approve" });

    useEffect(() => {
        if (!user || user.role !== "admin") return navigate("/");
        loadBanners();
    }, [user, navigate, filterStatus]);

    const loadBanners = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get(`/api/banners?status=${filterStatus}`);
            setBanners(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const submitReview = async () => {
        const { banner, fee, rejectReason, type } = reviewModal;
        if (type === "approve" && (!fee || fee < 100000)) return alert("Phí duyệt tối thiểu: 100,000đ");
        if (type === "reject" && !rejectReason.trim()) return alert("Vui lòng nhập lý do từ chối");

        try {
            await axiosClient.put(`/api/banners/${banner._id}/review`, {
                action: type,
                fee: type === "approve" ? Number(fee) : 0,
                rejectedReason: type === "reject" ? rejectReason : ""
            });
            alert(type === "approve" ? "Đã duyệt, chuyển sang chờ thanh toán!" : "Đã từ chối quảng cáo.");
            setReviewModal({ show: false, banner: null, fee: 100000, rejectReason: "", type: "approve" });
            loadBanners();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi thao tác");
        }
    };

    const confirmPayment = async (id) => {
        if (!window.confirm("Xác nhận Seller đã chuyển khoản đúng số tiền? Hệ thống sẽ kích hoạt ngay lập tức!")) return;
        try {
            await axiosClient.put(`/api/banners/${id}/confirm-payment`);
            alert("Đã xác nhận thanh toán! Quảng cáo hiện đang active.");
            loadBanners();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi thao tác");
        }
    };

    const handleEnd = async (id) => {
        if (!window.confirm("Kết thúc hợp đồng / Gỡ quảng cáo này?")) return;
        try {
            await axiosClient.put(`/api/banners/${id}/end`);
            alert("Đã gỡ quảng cáo.");
            loadBanners();
        } catch (err) {
            alert("Lỗi thao tác");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending": return <span className="as-badge as-badge-warning">Chờ duyệt nội dung</span>;
            case "rejected": return <span className="as-badge as-badge-danger">Từ chối</span>;
            case "awaiting_payment": return <span className="as-badge as-badge-info">Chờ thanh toán</span>;
            case "active": return <span className="as-badge as-badge-success">Đang trực tuyến</span>;
            case "ended": return <span className="as-badge as-badge-neutral">Đã kết thúc / Gỡ</span>;
            default: return <span className="as-badge">{status}</span>;
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Hệ thống Quảng cáo (Banners)</h1>
            </div>

            <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
                {["pending", "awaiting_payment", "active", "ended", "rejected"].map(status => (
                    <button
                        key={status}
                        className={`as-btn ${filterStatus === status ? "as-btn-primary" : "as-btn-outline"}`}
                        onClick={() => setFilterStatus(status)}
                        style={{ padding: "8px 16px", borderRadius: 20, textTransform: "capitalize" }}
                    >
                        {status.replace("_", " ")}
                    </button>
                ))}
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>
                ) : banners.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--as-text-muted)" }}>Không có quảng cáo nào trong mục này</div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Banner quảng cáo</th>
                                <th>Gian hàng</th>
                                <th>Vị trí / Trỏ về</th>
                                <th>Phí / Thời hạn</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map(b => (
                                <tr key={b._id}>
                                    <td>
                                        <div style={{ display: "flex", gap: 16 }}>
                                            {b.imageUrl ? (
                                                <img src={b.imageUrl} alt={b.title} style={{ width: 100, height: 50, objectFit: "cover", borderRadius: 8, border: "1px solid var(--as-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }} />
                                            ) : (
                                                <div style={{ width: 100, height: 50, background: "rgba(0,0,0,0.05)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "var(--as-text-muted)" }}>No Image</div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--as-text)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                                                <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 4, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{b.seller?.sellerInfo?.shopName || b.seller?.name}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 4 }}>{b.seller?.email}</div>
                                    </td>
                                    <td>
                                        <div><span style={{ fontWeight: 600, color: "var(--as-primary)", background: "rgba(79, 70, 229, 0.1)", padding: "2px 8px", borderRadius: 12, fontSize: "0.8rem" }}>{b.position}</span></div>
                                        <div style={{ color: "var(--as-text-muted)", fontSize: "0.85rem", marginTop: 4 }}>Target: {b.targetType}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: "var(--as-danger)", fontSize: "1.05rem" }}>{b.fee ? fmt(b.fee) : "Chưa báo giá"}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 4, fontWeight: 500 }}>{b.requestedDays} ngày</div>
                                    </td>
                                    <td>
                                        {getStatusBadge(b.status)}
                                        {b.status === "active" && b.endDate && (
                                            <div style={{ fontSize: "0.8rem", color: "var(--as-text-muted)", marginTop: 6, fontWeight: 500 }}>
                                                Hạn: {new Date(b.endDate).toLocaleDateString("vi-VN")}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {b.status === "pending" && (
                                            <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                                                <button className="as-btn as-btn-primary" onClick={() => setReviewModal({ show: true, banner: b, fee: 100000, rejectReason: "", type: "approve" })} style={{ padding: "6px 12px", fontSize: "0.85rem", width: "100%" }}>
                                                    Báo Giá & Duyệt
                                                </button>
                                                <button className="as-btn as-btn-outline" onClick={() => setReviewModal({ show: true, banner: b, fee: 0, rejectReason: "", type: "reject" })} style={{ padding: "6px 12px", fontSize: "0.85rem", borderColor: "var(--as-danger)", color: "var(--as-danger)", width: "100%" }}>
                                                    Từ chối
                                                </button>
                                            </div>
                                        )}
                                        {b.status === "awaiting_payment" && (
                                            <button className="as-btn as-btn-primary" onClick={() => confirmPayment(b._id)} style={{ width: "100%", padding: "6px 12px", fontSize: "0.85rem" }}>
                                                Xác nhận đã CK
                                            </button>
                                        )}
                                        {b.status === "active" && (
                                            <button className="as-btn as-btn-outline" onClick={() => handleEnd(b._id)} style={{ padding: "6px 12px", fontSize: "0.85rem", borderColor: "var(--as-danger)", color: "var(--as-danger)", width: "100%" }}>
                                                Kết thúc / Gỡ
                                            </button>
                                        )}
                                        {["rejected", "ended"].includes(b.status) && <span style={{ color: "var(--as-text-muted)", fontSize: "0.85rem", fontWeight: 500 }}>Đã xử lý xong</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Báo Giá / Từ Chối */}
            {reviewModal.show && (
                <div className="modal-overlay">
                    <div className="as-card" style={{ maxWidth: 500, width: "100%", padding: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: "1.25rem", color: reviewModal.type === "approve" ? "var(--as-text)" : "var(--as-danger)" }}>{reviewModal.type === "approve" ? "Duyệt & Báo Giá Quảng Cáo" : "Từ chối Bản nháp"}</h3>
                            <button style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--as-text-muted)" }} onClick={() => setReviewModal({ show: false, banner: null, fee: 100000, rejectReason: "", type: "approve" })}>&times;</button>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            {reviewModal.type === "approve" ? (
                                <>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Phí tính cho {reviewModal.banner.requestedDays} ngày hiển thị (VNĐ) *</label>
                                    <input
                                        type="number"
                                        style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", fontSize: "1rem" }}
                                        min="100000"
                                        value={reviewModal.fee}
                                        onChange={e => setReviewModal({ ...reviewModal, fee: e.target.value })}
                                    />
                                    <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 8 }}>Tối thiểu 100,000đ. Seller sẽ nhận được thông báo chuyển khoản kèm số tiền này.</div>
                                </>
                            ) : (
                                <>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Lý do từ chối *</label>
                                    <textarea
                                        style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", fontSize: "0.95rem", resize: "vertical" }}
                                        rows="4"
                                        value={reviewModal.rejectReason}
                                        onChange={e => setReviewModal({ ...reviewModal, rejectReason: e.target.value })}
                                        placeholder="Ảnh mờ, sai kích thước, nội dung phản cảm..."
                                    />
                                </>
                            )}
                        </div>
                        <button
                            className={`as-btn ${reviewModal.type === "approve" ? "as-btn-primary" : "as-btn-danger"}`}
                            style={{ width: "100%", padding: 14, fontSize: "1rem" }}
                            onClick={submitReview}
                        >
                            {reviewModal.type === "approve" ? "Xác nhận báo giá" : "Xác nhận từ chối"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
