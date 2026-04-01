import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaHistory } from "react-icons/fa";
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
        if (!user || user.role !== "admin") return navigate("/");
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
            await axiosClient.put(`/api/users/${rejectModal.sellerId}/reject-seller`, {
                reason: rejectModal.reason
            });
            alert("Đã từ chối gian hàng.");
            setRejectModal({ show: false, sellerId: null, reason: "" });
            loadSellers();
        } catch (err) {
            alert(err.response?.data?.message || "Từ chối thất bại.");
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!window.confirm(`Thay đổi trạng thái gian hàng thành "${newStatus}"?`)) return;
        try {
            await axiosClient.put(`/api/users/${id}/seller-status`, { status: newStatus });
            alert("Cập nhật trạng thái thành công.");
            loadSellers();
        } catch (err) {
            alert(err.response?.data?.message || "Cập nhật thất bại.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending": return <span className="as-badge as-badge-warning">Chờ duyệt</span>;
            case "active": return <span className="as-badge as-badge-success">Hoạt động</span>;
            case "violation": return <span className="as-badge as-badge-danger">Vi phạm</span>;
            case "locked": return <span className="as-badge as-badge-neutral" style={{ background: "#1f2937", color: "white" }}>Khóa</span>;
            case "inactive": return <span className="as-badge as-badge-neutral">Tạm ngưng</span>;
            default: return <span className="as-badge">{status}</span>;
        }
    };

    const filteredSellers = filterStatus === "all"
        ? sellers
        : sellers.filter(s => s.sellerInfo?.sellerStatus === filterStatus);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Quản lý Gian hàng</h1>
            </div>

            {/* Filter tabs */}
            <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
                {["all", "pending", "active", "violation", "locked", "inactive"].map(status => (
                    <button
                        key={status}
                        className={`as-btn ${filterStatus === status ? "as-btn-primary" : "as-btn-outline"}`}
                        onClick={() => setFilterStatus(status)}
                        style={{ textTransform: "capitalize", padding: "8px 16px", borderRadius: 20 }}
                    >
                        {status === "all" ? "Tất cả" : status}
                    </button>
                ))}
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>
                ) : filteredSellers.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--as-text-muted)" }}>Không có gian hàng nào phù hợp</div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Gian hàng</th>
                                <th>Email chủ thẻ</th>
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
                                            <div style={{ fontWeight: 600 }}>{info.shopName || s.name}</div>
                                            <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 4 }}>
                                                {info.phone} • {info.address}
                                            </div>
                                        </td>
                                        <td style={{ color: "var(--as-text-muted)" }}>{s.email}</td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: info.reputationScore >= 4 ? "var(--as-success)" : "var(--as-danger)" }}>
                                                {info.reputationScore || 0}/5
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span className={`as-badge ${info.violationCount > 0 ? "as-badge-danger" : "as-badge-neutral"}`}>
                                                    {info.violationCount || 0}
                                                </span>
                                                {(info.violationHistory?.length > 0) && (
                                                    <button
                                                        className="as-btn-outline"
                                                        title="Xem lịch sử vi phạm"
                                                        onClick={() => setHistoryModal({ show: true, history: info.violationHistory, sellerName: info.shopName })}
                                                        style={{ padding: "4px 8px", borderRadius: 8, border: "none", background: "rgba(0,0,0,0.05)" }}
                                                    >
                                                        <FaHistory />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {getStatusBadge(info.sellerStatus)}
                                            {info.sellerStatus === "pending" && info.rejectedReason && (
                                                <div style={{ fontSize: "0.8rem", color: "var(--as-danger)", marginTop: 6, maxWidth: 180, lineHeight: 1.4 }}>
                                                    Lý do: {info.rejectedReason}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: "0.85rem", color: "var(--as-text-muted)" }}>
                                            {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td>
                                            {info.sellerStatus === "pending" ? (
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <button className="as-btn as-btn-primary" onClick={() => handleApprove(s._id)} style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        className="as-btn as-btn-outline"
                                                        onClick={() => setRejectModal({ show: true, sellerId: s._id, reason: "" })}
                                                        style={{ padding: "6px 12px", fontSize: "0.85rem", borderColor: "var(--as-danger)", color: "var(--as-danger)" }}
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    value={info.sellerStatus}
                                                    onChange={(e) => handleStatusChange(s._id, e.target.value)}
                                                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--as-border)", fontSize: "0.9rem", background: "white", outline: "none", cursor: "pointer" }}
                                                >
                                                    <option value="active">Active (Hoạt động)</option>
                                                    <option value="violation">Violation (Vi phạm)</option>
                                                    <option value="inactive">Inactive (Tạm ngưng)</option>
                                                    <option value="locked">Locked (Khóa vĩnh viễn)</option>
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

            {/* Modal Từ Chối */}
            {rejectModal.show && (
                <div className="modal-overlay">
                    <div className="as-card" style={{ maxWidth: 450, width: "100%", padding: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--as-danger)" }}>Từ chối gian hàng</h3>
                            <button style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--as-text-muted)" }} onClick={() => setRejectModal({ show: false, sellerId: null, reason: "" })}>&times;</button>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Lý do từ chối <span style={{ color: "red" }}>*</span></label>
                            <textarea
                                style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--as-border)", outline: "none", resize: "vertical", fontSize: "0.95rem" }}
                                rows="4"
                                placeholder="Nhập lý do từ chối để seller có thể sửa đổi bổ sung..."
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            ></textarea>
                        </div>
                        <button className="as-btn as-btn-danger" style={{ width: "100%" }} onClick={handleReject}>
                            Xác nhận Từ chối
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Lịch sử Vi phạm */}
            {historyModal.show && (
                <div className="modal-overlay">
                    <div className="as-card" style={{ maxWidth: 500, width: "100%", padding: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Lịch sử vi phạm - {historyModal.sellerName}</h3>
                            <button style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--as-text-muted)" }} onClick={() => setHistoryModal({ show: false, history: [], sellerName: "" })}>&times;</button>
                        </div>
                        <div style={{ maxHeight: 400, overflowY: "auto" }}>
                            {historyModal.history.length === 0 ? (
                                <p style={{ color: "var(--as-text-muted)", textAlign: "center" }}>Chưa có vi phạm nào.</p>
                            ) : (
                                <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
                                    {historyModal.history.map((h, i) => (
                                        <li key={i} style={{ padding: 16, background: "rgba(0,0,0,0.02)", borderRadius: 12, border: "1px solid var(--as-border)" }}>
                                            <div style={{ color: "var(--as-text-muted)", fontSize: "0.85rem", marginBottom: 4 }}>
                                                {new Date(h.date).toLocaleString("vi-VN")}
                                            </div>
                                            <div style={{ color: "var(--as-text)", fontWeight: 500 }}>{h.reason}</div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
