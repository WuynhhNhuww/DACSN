import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaHistory, FaCheck, FaTimes } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

export default function AdminSellers() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");

    const [rejectModal, setRejectModal] = useState({ show: false, sellerId: null, reason: "" });
    const [historyModal, setHistoryModal] = useState({ show: false, history: [], sellerName: "" });

    useEffect(() => {
        if (!user || user.role !== "admin") return navigate("/home");
        loadSellers();
    }, [user, navigate]);

    const loadSellers = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get("/api/users?role=seller");
            setSellers(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Duyệt cho người bán này?")) return;
        try {
            await axiosClient.put(`/api/users/${id}/approve-seller`);
            alert("Duyệt thành công!");
            loadSellers();
        } catch (err) {
            alert(err.response?.data?.message || "Duyệt thất bại.");
        }
    };

    const handleReject = async () => {
        if (!rejectModal.reason.trim()) return alert("Vui lòng nhập lý do từ chối");
        try {
            await axiosClient.put(`/api/users/${rejectModal.sellerId}/reject-seller`, { reason: rejectModal.reason });
            alert("Đã từ chối gian hàng.");
            setRejectModal({ show: false, sellerId: null, reason: "" });
            loadSellers();
        } catch (err) {
            alert(err.response?.data?.message || "Từ chối thất bại.");
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!window.confirm(`Thay đổi trạng thái thành "${newStatus}"?`)) return;
        try {
            await axiosClient.put(`/api/users/${id}/seller-status`, { status: newStatus });
            loadSellers();
        } catch (err) {
            alert(err.response?.data?.message || "Cập nhật thất bại.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":  return <span className="as-badge as-badge-warning">Chờ duyệt</span>;
            case "active":   return <span className="as-badge as-badge-success">Hoạt động</span>;
            case "violation":return <span className="as-badge as-badge-danger">Vi phạm</span>;
            case "locked":   return <span className="as-badge as-badge-dark">Đã khóa</span>;
            case "inactive": return <span className="as-badge as-badge-neutral">Tạm ngưng</span>;
            default:         return <span className="as-badge">{status}</span>;
        }
    };

    const FILTERS = [
        { key: "all", label: "Tất cả" },
        { key: "pending", label: "Chờ duyệt" },
        { key: "active", label: "Hoạt động" },
        { key: "violation", label: "Vi phạm" },
        { key: "locked", label: "Đã khóa" },
        { key: "inactive", label: "Tạm ngưng" },
    ];

    const filteredSellers = filterStatus === "all"
        ? sellers
        : sellers.filter(s => s.sellerInfo?.sellerStatus === filterStatus);

    return (
        <div>
            <div className="as-page-header">
                <div className="as-page-header-left">
                    <h1 className="as-page-title">Gian hàng</h1>
                    <p className="as-page-subtitle">
                        <span style={{ fontWeight: 700, color: "var(--as-primary)" }}>{sellers.length}</span> gian hàng đã đăng ký
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="as-filter-bar">
                {FILTERS.map(f => {
                    const cnt = f.key === "all" ? sellers.length : sellers.filter(s => s.sellerInfo?.sellerStatus === f.key).length;
                    return (
                        <button
                            key={f.key}
                            className={`as-filter-tab ${filterStatus === f.key ? "active" : ""}`}
                            onClick={() => setFilterStatus(f.key)}
                        >
                            {f.label}
                            <span className="count">{cnt}</span>
                        </button>
                    );
                })}
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div className="as-table-loading"><div className="as-spinner" /><span>Đang tải dữ liệu...</span></div>
                ) : filteredSellers.length === 0 ? (
                    <div className="as-table-empty">Không có gian hàng nào phù hợp</div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Gian hàng</th>
                                <th>Email</th>
                                <th>Uy tín</th>
                                <th>Vi phạm</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSellers.map(s => {
                                const info = s.sellerInfo || {};
                                return (
                                    <tr key={s._id}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: "var(--as-text)", fontSize: "0.95rem" }}>
                                                {info.shopName || s.name}
                                            </div>
                                            <div className="as-text-sm as-text-muted-c" style={{ marginTop: 3 }}>
                                                {info.phone}{info.phone && info.address ? " · " : ""}{info.address}
                                            </div>
                                        </td>
                                        <td style={{ color: "var(--as-text-muted)", fontSize: "0.875rem" }}>{s.email}</td>
                                        <td>
                                            <div style={{
                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                fontWeight: 700, fontSize: "0.9rem",
                                                color: info.reputationScore >= 4 ? "var(--as-success-dark)" : info.reputationScore >= 2 ? "var(--as-warning)" : "var(--as-danger-dark)"
                                            }}>
                                                ★ {info.reputationScore || 0}
                                                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--as-text-muted)" }}>/5</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span className={`as-badge ${info.violationCount > 0 ? "as-badge-danger" : "as-badge-neutral"}`}>
                                                    {info.violationCount || 0} vi phạm
                                                </span>
                                                {info.violationHistory?.length > 0 && (
                                                    <button
                                                        className="as-btn-ghost as-btn-icon"
                                                        title="Xem lịch sử vi phạm"
                                                        onClick={() => setHistoryModal({ show: true, history: info.violationHistory, sellerName: info.shopName })}
                                                        style={{ padding: "5px", borderRadius: 8, border: "1px solid var(--as-border)", background: "var(--as-bg)" }}
                                                    >
                                                        <FaHistory size={12} style={{ color: "var(--as-text-muted)" }} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {getStatusBadge(info.sellerStatus)}
                                            {info.sellerStatus === "pending" && info.rejectedReason && (
                                                <div style={{ fontSize: "0.78rem", color: "var(--as-danger-dark)", marginTop: 5, lineHeight: 1.4 }}>
                                                    Lý do: {info.rejectedReason}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: "0.82rem", color: "var(--as-text-muted)" }}>
                                            {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td>
                                            {info.sellerStatus === "pending" ? (
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <button className="as-btn as-btn-sm as-btn-success" onClick={() => handleApprove(s._id)}>
                                                        <FaCheck size={10} /> Duyệt
                                                    </button>
                                                    <button
                                                        className="as-btn as-btn-sm as-btn-outline"
                                                        style={{ borderColor: "var(--as-danger)", color: "var(--as-danger-dark)" }}
                                                        onClick={() => setRejectModal({ show: true, sellerId: s._id, reason: "" })}
                                                    >
                                                        <FaTimes size={10} /> Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    value={info.sellerStatus}
                                                    onChange={(e) => handleStatusChange(s._id, e.target.value)}
                                                    className="as-select"
                                                    style={{ width: "auto", minWidth: 160, padding: "7px 32px 7px 12px" }}
                                                >
                                                    <option value="active">Hoạt động</option>
                                                    <option value="violation">Vi phạm</option>
                                                    <option value="inactive">Tạm ngưng</option>
                                                    <option value="locked">Khóa vĩnh viễn</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal.show && (
                <div className="modal-overlay">
                    <div className="as-modal" style={{ maxWidth: 460 }}>
                        <div className="as-modal-header">
                            <h3 className="as-modal-title" style={{ color: "var(--as-danger-dark)" }}>Từ chối gian hàng</h3>
                            <button className="as-modal-close" onClick={() => setRejectModal({ show: false, sellerId: null, reason: "" })}>×</button>
                        </div>
                        <div className="as-form-group">
                            <label className="as-form-label">Lý do từ chối <span className="required">*</span></label>
                            <textarea
                                className="as-textarea"
                                rows="4"
                                placeholder="Nhập lý do để seller có thể sửa đổi bổ sung..."
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            />
                        </div>
                        <div className="as-modal-footer">
                            <button className="as-btn as-btn-outline" onClick={() => setRejectModal({ show: false, sellerId: null, reason: "" })}>Hủy</button>
                            <button className="as-btn as-btn-danger" onClick={handleReject}>Xác nhận từ chối</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Violation History Modal */}
            {historyModal.show && (
                <div className="modal-overlay">
                    <div className="as-modal" style={{ maxWidth: 520 }}>
                        <div className="as-modal-header">
                            <h3 className="as-modal-title">Lịch sử vi phạm · {historyModal.sellerName}</h3>
                            <button className="as-modal-close" onClick={() => setHistoryModal({ show: false, history: [], sellerName: "" })}>×</button>
                        </div>
                        <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                            {historyModal.history.length === 0 ? (
                                <p style={{ color: "var(--as-text-muted)", textAlign: "center", padding: "24px 0" }}>Chưa có vi phạm nào.</p>
                            ) : historyModal.history.map((h, i) => (
                                <div key={i} style={{
                                    padding: 14, background: "var(--as-bg)", borderRadius: 12,
                                    border: "1px solid var(--as-border)", borderLeft: "3px solid var(--as-danger)"
                                }}>
                                    <div style={{ fontSize: "0.75rem", color: "var(--as-text-muted)", marginBottom: 5, fontWeight: 500 }}>
                                        {new Date(h.date).toLocaleString("vi-VN")}
                                    </div>
                                    <div style={{ color: "var(--as-text)", fontWeight: 500, fontSize: "0.9rem" }}>{h.reason}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
