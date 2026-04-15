import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaGavel, FaCheckCircle, FaExclamationTriangle, FaCommentDots, FaUserSlash } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function AdminComplaints() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("escalated");

    const [resolveModal, setResolveModal] = useState({ show: false, complaint: null, resolution: "buyer_wins", refundAmount: 0, adminNote: "" });

    useEffect(() => {
        if (!user || user.role !== "admin") return navigate("/");
        loadComplaints();
    }, [user, navigate, filterStatus]);

    const loadComplaints = async () => {
        setLoading(true);
        try {
            const url = filterStatus === "escalated"
                ? "/api/complaints?escalated=true&status=escalated"
                : `/api/complaints?status=${filterStatus}`;
            const res = await axiosClient.get(url);
            setComplaints(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        const { complaint, resolution, refundAmount, adminNote } = resolveModal;

        if (resolution === "buyer_wins" && (!refundAmount || refundAmount <= 0)) {
            return alert("Vui lòng nhập số tiền hoàn trả hợp lệ cho người mua.");
        }
        if (resolution === "buyer_wins" && refundAmount > complaint.order.totalPrice) {
            return alert(`Số tiền hoàn không được vượt quá giá trị đơn hàng (${fmt(complaint.order.totalPrice)})`);
        }

        try {
            await axiosClient.put(`/api/complaints/${complaint._id}/resolve`, {
                resolution,
                refundAmount: resolution === "buyer_wins" ? Number(refundAmount) : 0,
                adminNote
            });
            setResolveModal({ show: false, complaint: null, resolution: "buyer_wins", refundAmount: 0, adminNote: "" });
            loadComplaints();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi thao tác");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "open":              return <span className="as-badge as-badge-warning">Buyer vừaếu nại</span>;
            case "seller_processing": return <span className="as-badge as-badge-info">Seller đã phản hồi</span>;
            case "escalated":         return <span className="as-badge as-badge-danger">Chờ Admin xử</span>;
            case "resolved":          return <span className="as-badge as-badge-success">Đã đóng</span>;
            default:                  return <span className="as-badge">{status}</span>;
        }
    };

    const TABS = [
        { key: "escalated", label: "Cần Admin phân xử" },
        { key: "seller_processing", label: "Seller đang phản hồi" },
        { key: "open", label: "Mới tạo" },
        { key: "resolved", label: "Đã giải quyết" },
    ];

    return (
        <div>
            <div className="as-page-header">
                <div className="as-page-header-left">
                    <h1 className="as-page-title">Khiếu nại & Tranh chấp</h1>
                    <p className="as-page-subtitle">Giải quyết xung đột quyền lợi giữa người mua và người bán</p>
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
                ) : complaints.length === 0 ? (
                    <div className="as-table-empty">
                        <FaCheckCircle style={{ fontSize: "2.5rem", color: "var(--as-success)", opacity: 0.8, marginBottom: 16 }} />
                        <div style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--as-text)" }}>Hòa bình thế giới!</div>
                        <div style={{ marginTop: 4 }}>Không có khiếu nại nào ở trạng thái này.</div>
                    </div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Chi tiết Đơn hàng & Lý do</th>
                                <th>Người thụ hưởng (Buyer)</th>
                                <th>Gian hàng (Seller)</th>
                                <th>Lịch sử trao đổi</th>
                                <th>Trạng thái</th>
                                <th className="as-text-right">Phán quyết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map(c => (
                                <tr key={c._id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: "var(--as-danger-dark)", fontSize: "0.95rem" }}>{c.reason}</div>
                                        <div className="as-infobox" style={{ marginTop: 8 }}>
                                            Đơn hàng: <span className="as-mono" style={{ fontWeight: 700 }}>#{c.order?._id.slice(-6).toUpperCase()}</span><br />
                                            Tổng g.trị: <span style={{ fontWeight: 700, color: "var(--as-primary)" }}>{fmt(c.order?.totalPrice)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.buyer?.name}</div>
                                        <div className="as-text-sm as-text-muted-c" style={{ marginTop: 2 }}>{c.buyer?.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.seller?.sellerInfo?.shopName || c.seller?.name}</div>
                                        <div className="as-text-sm" style={{ marginTop: 2, color: "var(--as-danger-dark)", fontWeight: 500 }}>
                                            Uy tín Shop: <span style={{ fontWeight: 700 }}>{c.seller?.sellerInfo?.reputationScore || 0}</span>/5
                                        </div>
                                    </td>
                                    <td>
                                        <div className="as-thread" style={{ minWidth: 260, maxWidth: 350 }}>
                                            <div className="as-thread-item as-thread-buyer">
                                                <div className="as-thread-label" style={{ color: "var(--as-danger-dark)" }}>Buyer nói:</div>
                                                <div>{c.description || <span style={{ fontStyle: "italic", color: "var(--as-text-subtle)" }}>Không có mô tả chi tiết</span>}</div>
                                                {c.evidenceImages?.length > 0 && (
                                                    <div style={{ marginTop: 6 }}>
                                                        <a href={c.evidenceImages[0]} target="_blank" rel="noreferrer" style={{ color: "var(--as-primary)", textDecoration: "underline", fontWeight: 500, fontSize: "0.75rem" }}>
                                                            📄 Xem ảnh bằng chứng
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                            {c.sellerResponse ? (
                                                <div className="as-thread-item as-thread-seller">
                                                    <div className="as-thread-label" style={{ color: "var(--as-success-dark)" }}>Seller phản hồi:</div>
                                                    <div>{c.sellerResponse}</div>
                                                    <div style={{ marginTop: 6, fontWeight: 700, color: "var(--as-primary)" }}>
                                                        Đề nghị hoàn tiền: {fmt(c.proposedRefundAmount)}
                                                    </div>
                                                    {c.buyerAccepted === false && (
                                                        <div style={{ marginTop: 6, color: "var(--as-danger)", fontWeight: 600, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                                                            <FaUserSlash /> Buyer bấm Không đồng ý / Yêu cầu Admin
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="as-thread-item" style={{ background: "transparent", borderLeftColor: "var(--as-border-strong)", color: "var(--as-text-subtle)", fontStyle: "italic", fontSize: "0.75rem" }}>
                                                    <FaCommentDots style={{ marginRight: 4 }} /> Seller chưa lên tiếng...
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(c.status)}</td>
                                    <td className="as-text-right">
                                        {c.status === "escalated" ? (
                                            <button
                                                className="as-btn as-btn-danger"
                                                onClick={() => setResolveModal({ show: true, complaint: c, resolution: "buyer_wins", refundAmount: c.order?.totalPrice || 0, adminNote: "" })}
                                                style={{ width: "100%", whiteSpace: "nowrap" }}
                                            >
                                                <FaGavel size={14} /> Mở phiên tòa
                                            </button>
                                        ) : c.status === "resolved" ? (
                                            <div style={{ padding: "10px 14px", background: c.resolution === "buyer_wins" ? "var(--as-success-bg)" : "var(--as-danger-bg)", borderRadius: 12, textAlign: "right" }}>
                                                <div style={{ fontWeight: 800, color: c.resolution === "buyer_wins" ? "var(--as-success-dark)" : "var(--as-danger-dark)", fontSize: "0.9rem" }}>
                                                    {c.resolution === "buyer_wins" ? "Khách được đền" : "Shop thắng"}
                                                </div>
                                                {c.resolution === "buyer_wins" && (
                                                    <div style={{ color: "var(--as-text-secondary)", fontSize: "0.8rem", marginTop: 4, fontWeight: 600 }}>
                                                        Hoàn: <span style={{ color: "var(--as-text)" }}>{fmt(c.refundAmount)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="as-text-sm as-text-muted-c" style={{ fontStyle: "italic" }}>Hai bên đang tự xử lý</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Resolve Modal */}
            {resolveModal.show && (
                <div className="modal-overlay">
                    <div className="as-modal" style={{ maxWidth: 580 }}>
                        <div className="as-modal-header" style={{ marginBottom: 20 }}>
                            <div className="as-flex-center as-gap-12">
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--as-danger-bg)", color: "var(--as-danger-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                                    <FaGavel />
                                </div>
                                <div>
                                    <h3 className="as-modal-title">Phiên tòa Tối cao WPN</h3>
                                    <div className="as-text-sm as-text-muted-c" style={{ marginTop: 2 }}>Phán quyết không thể kháng cáo</div>
                                </div>
                            </div>
                            <button className="as-modal-close" onClick={() => setResolveModal({ show: false, complaint: null, resolution: "buyer_wins", refundAmount: 0, adminNote: "" })}>×</button>
                        </div>

                        <div className="as-form-group as-mb-20" style={{ background: "var(--as-bg)", padding: 20, borderRadius: 16, border: "1px dashed var(--as-border-strong)" }}>
                            <label className="as-form-label as-mb-8">Quyết định ai thắng kiện? <span className="required">*</span></label>
                            <select
                                className="as-select"
                                style={{ fontSize: "1.05rem", padding: "12px 16px", fontWeight: 700 }}
                                value={resolveModal.resolution}
                                onChange={e => setResolveModal({ ...resolveModal, resolution: e.target.value })}
                            >
                                <option value="buyer_wins">🛡️ BẢO VỆ NGƯỜI MUA (Phạt Shop, Hoàn tiền Khách)</option>
                                <option value="seller_wins">⭐ BẢO VỆ NGƯỜI BÁN (Từ chối đòi hỏi của Khách)</option>
                            </select>
                        </div>

                        {resolveModal.resolution === "buyer_wins" && (
                            <div className="as-form-group as-mb-20">
                                <label className="as-form-label">
                                    Số tiền bồi thường cho Khách (₫) <span className="required">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="as-input"
                                    min="0"
                                    max={resolveModal.complaint?.order?.totalPrice}
                                    style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--as-danger-dark)", padding: "14px 16px" }}
                                    value={resolveModal.refundAmount}
                                    onChange={e => setResolveModal({ ...resolveModal, refundAmount: e.target.value })}
                                />
                                <div className="as-alert as-alert-danger as-mt-8" style={{ padding: "10px 14px", marginBottom: 0 }}>
                                    <FaExclamationTriangle style={{ marginTop: 2 }} />
                                    <div>
                                        Tối đa có thể hoàn: <strong>{fmt(resolveModal.complaint?.order?.totalPrice)}</strong><br />
                                        Hệ thống sẽ ép <strong>hoàn khoản tiền này lại ví Buyer</strong>, đồng thời shop bị <strong>-1 điểm uy tín</strong> và khóa sản phẩm nếu vi phạm nặng.
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="as-form-group as-mb-24">
                            <label className="as-form-label">Ghi chú sổ án của Admin (Log nội bộ)</label>
                            <textarea
                                className="as-textarea"
                                rows="3"
                                placeholder="..."
                                value={resolveModal.adminNote}
                                onChange={e => setResolveModal({ ...resolveModal, adminNote: e.target.value })}
                            />
                        </div>

                        <div className="as-modal-footer">
                            <button className="as-btn as-btn-outline" onClick={() => setResolveModal({ show: false, complaint: null, resolution: "buyer_wins", refundAmount: 0, adminNote: "" })}>Hủy</button>
                            <button className="as-btn as-btn-danger" onClick={handleResolve}>
                                <FaGavel style={{ marginRight: 4 }} /> Gõ Búa - Chốt Phán Quyết
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
