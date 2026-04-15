import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaTimes, FaMoneyBillWave, FaStopCircle, FaBullhorn } from "react-icons/fa";
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
            loadBanners();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi thao tác");
        }
    };

    const handleEnd = async (id) => {
        if (!window.confirm("Kết thúc hợp đồng / Gỡ quảng cáo này?")) return;
        try {
            await axiosClient.put(`/api/banners/${id}/end`);
            loadBanners();
        } catch (err) {
            alert("Lỗi thao tác");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":          return <span className="as-badge as-badge-warning">Chờ duyệt nội dung</span>;
            case "rejected":         return <span className="as-badge as-badge-danger">Đã từ chối</span>;
            case "awaiting_payment": return <span className="as-badge as-badge-info">Chờ thanh toán</span>;
            case "active":           return <span className="as-badge as-badge-success">Đang xuất bản</span>;
            case "ended":            return <span className="as-badge as-badge-neutral">Đã Gỡ</span>;
            default:                 return <span className="as-badge">{status}</span>;
        }
    };

    const TABS = [
        { key: "pending", label: "Chờ duyệt" },
        { key: "awaiting_payment", label: "Chờ thanh toán" },
        { key: "active", label: "Đang hiển thị" },
        { key: "ended", label: "Đã gỡ" },
        { key: "rejected", label: "Từ chối" },
    ];

    return (
        <div>
            <div className="as-page-header">
                <div className="as-page-header-left">
                    <h1 className="as-page-title">Hệ thống Quảng cáo</h1>
                    <p className="as-page-subtitle">Duyệt banner quảng cáo do người bán yêu cầu</p>
                </div>
            </div>

            <div className="as-filter-bar">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`as-filter-tab ${filterStatus === t.key ? "active" : ""}`}
                        onClick={() => setFilterStatus(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div className="as-table-loading"><div className="as-spinner" /><span>Đang tải...</span></div>
                ) : banners.length === 0 ? (
                    <div className="as-table-empty">
                        <FaBullhorn style={{ fontSize: "2rem", color: "var(--as-border-strong)", marginBottom: 12 }} />
                        <div>Không có quảng cáo nào trong mục này</div>
                    </div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Chi tiết Banner</th>
                                <th>Gian hàng</th>
                                <th>Thông tin placement</th>
                                <th>Chi phí & Thời hạn</th>
                                <th>Trạng thái</th>
                                <th className="as-text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map(b => (
                                <tr key={b._id}>
                                    <td>
                                        <div className="as-product-cell">
                                            {b.imageUrl ? (
                                                <img src={b.imageUrl} alt={b.title} style={{ width: 110, height: 50, objectFit: "cover", borderRadius: 8, border: "1px solid var(--as-border)", flexShrink: 0 }} />
                                            ) : (
                                                <div style={{ width: 110, height: 50, background: "var(--as-bg)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "var(--as-text-muted)", flexShrink: 0 }}>No Image</div>
                                            )}
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div className="as-product-name">{b.title}</div>
                                                <div className="as-text-sm as-text-muted-c" style={{ marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                                                    {b.description}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{b.seller?.sellerInfo?.shopName || b.seller?.name}</div>
                                        <div className="as-text-sm as-text-muted-c" style={{ marginTop: 3 }}>{b.seller?.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: "inline-flex", background: "var(--as-bg)", padding: "4px 10px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700, color: "var(--as-primary)", marginBottom: 4 }}>
                                            {b.position}
                                        </div>
                                        <div className="as-text-sm as-text-muted-c">Trỏ về: <span style={{ fontWeight: 500 }}>{b.targetType}</span></div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 800, color: "var(--as-danger-dark)", fontSize: "1.05rem" }}>
                                            {b.fee ? fmt(b.fee) : "---"}
                                        </div>
                                        <div className="as-text-sm as-text-muted-c" style={{ marginTop: 4, fontWeight: 500 }}>
                                            {b.requestedDays} ngày
                                        </div>
                                    </td>
                                    <td>
                                        {getStatusBadge(b.status)}
                                        {b.status === "active" && b.endDate && (
                                            <div className="as-text-sm as-text-muted-c" style={{ marginTop: 6, fontWeight: 600 }}>
                                                Hạn: {new Date(b.endDate).toLocaleDateString("vi-VN")}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", minWidth: 120 }}>
                                            {b.status === "pending" && (
                                                <>
                                                    <button className="as-btn as-btn-sm as-btn-primary" style={{ width: "100%" }} onClick={() => setReviewModal({ show: true, banner: b, fee: 100000, rejectReason: "", type: "approve" })}>
                                                        <FaMoneyBillWave size={10} /> Báo giá & Duyệt
                                                    </button>
                                                    <button className="as-btn as-btn-sm as-btn-outline" style={{ width: "100%", borderColor: "var(--as-danger)", color: "var(--as-danger-dark)" }} onClick={() => setReviewModal({ show: true, banner: b, fee: 0, rejectReason: "", type: "reject" })}>
                                                        <FaTimes size={10} /> Từ chối
                                                    </button>
                                                </>
                                            )}
                                            {b.status === "awaiting_payment" && (
                                                <button className="as-btn as-btn-sm as-btn-success" style={{ width: "100%" }} onClick={() => confirmPayment(b._id)}>
                                                    <FaCheck size={10} /> Đã nhận chuyển khoản
                                                </button>
                                            )}
                                            {b.status === "active" && (
                                                <button className="as-btn as-btn-sm" style={{ background: "rgba(244,63,94,0.06)", color: "var(--as-danger-dark)", border: "1px solid rgba(244,63,94,0.15)", width: "100%" }} onClick={() => handleEnd(b._id)}>
                                                    <FaStopCircle size={10} /> Gỡ quảng cáo
                                                </button>
                                            )}
                                            {["rejected", "ended"].includes(b.status) && (
                                                <span style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", fontWeight: 500, fontStyle: "italic" }}>Không có c/đ</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Review Modal */}
            {reviewModal.show && (
                <div className="modal-overlay">
                    <div className="as-modal" style={{ maxWidth: 500 }}>
                        <div className="as-modal-header">
                            <h3 className="as-modal-title" style={{ color: reviewModal.type === "approve" ? "var(--as-primary)" : "var(--as-danger-dark)" }}>
                                {reviewModal.type === "approve" ? "Duyệt & Báo giá Quảng Cáo" : "Từ chối Bản thảo"}
                            </h3>
                            <button className="as-modal-close" onClick={() => setReviewModal({ show: false, banner: null, fee: 100000, rejectReason: "", type: "approve" })}>×</button>
                        </div>

                        <div className="as-form-group">
                            {reviewModal.type === "approve" ? (
                                <>
                                    <label className="as-form-label">Phí tính cho {reviewModal.banner.requestedDays} ngày hiển thị (₫) <span className="required">*</span></label>
                                    <input
                                        type="number"
                                        className="as-input"
                                        min="100000"
                                        value={reviewModal.fee}
                                        style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--as-primary)" }}
                                        onChange={e => setReviewModal({ ...reviewModal, fee: e.target.value })}
                                    />
                                    <div style={{ fontSize: "0.8rem", color: "var(--as-text-subtle)", marginTop: 4 }}>
                                        Tối thiểu 100,000đ. Seller sẽ nhận được thông báo chuyển khoản để kích hoạt.
                                    </div>
                                </>
                            ) : (
                                <>
                                    <label className="as-form-label">Lý do từ chối <span className="required">*</span></label>
                                    <textarea
                                        className="as-textarea"
                                        rows="4"
                                        value={reviewModal.rejectReason}
                                        onChange={e => setReviewModal({ ...reviewModal, rejectReason: e.target.value })}
                                        placeholder="Ảnh mờ, sai kích thước, nội dung vi phạm..."
                                    />
                                </>
                            )}
                        </div>

                        <div className="as-modal-footer">
                            <button className="as-btn as-btn-outline" onClick={() => setReviewModal({ show: false, banner: null, fee: 100000, rejectReason: "", type: "approve" })}>Hủy</button>
                            <button
                                className={`as-btn ${reviewModal.type === "approve" ? "as-btn-primary" : "as-btn-danger"}`}
                                onClick={submitReview}
                            >
                                {reviewModal.type === "approve" ? "Chốt báo giá" : "Xác nhận từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
