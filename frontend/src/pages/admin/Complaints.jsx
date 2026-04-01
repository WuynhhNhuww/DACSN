import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
            return alert("Vui lòng nhập số tiền hoàn trả cho người mua");
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
            alert(`Đã giải quyết! ${resolution === "buyer_wins" ? "Hoàn tiền cho người mua, trừ điểm uy tín người bán." : "Từ chối yêu cầu của người mua."}`);
            setResolveModal({ show: false, complaint: null, resolution: "buyer_wins", refundAmount: 0, adminNote: "" });
            loadComplaints();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi thao tác");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "open": return <span className="as-badge as-badge-warning">Chờ Seller xử lý</span>;
            case "seller_processing": return <span className="as-badge as-badge-info">Seller đã phản hồi</span>;
            case "escalated": return <span className="as-badge as-badge-danger">Admin phân xử</span>;
            case "resolved": return <span className="as-badge as-badge-success">Đã giải quyết</span>;
            default: return <span className="as-badge">{status}</span>;
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Khiếu Nại & Tranh Chấp</h1>
            </div>

            <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
                {["escalated", "resolved", "open", "seller_processing"].map(status => (
                    <button
                        key={status}
                        className={`as-btn ${filterStatus === status ? "as-btn-primary" : "as-btn-outline"}`}
                        onClick={() => setFilterStatus(status)}
                        style={{ padding: "8px 16px", borderRadius: 20, textTransform: "capitalize" }}
                    >
                        {status === "escalated" ? "Cần Admin phân xử" : status.replace("_", " ")}
                    </button>
                ))}
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>
                ) : complaints.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--as-text-muted)" }}>Không có khiếu nại nào ở mục này</div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Người khiếu nại (Buyer)</th>
                                <th>Bị khiếu nại (Seller)</th>
                                <th>Chi tiết đơn & Lý do</th>
                                <th>Phản hồi nội bộ</th>
                                <th>Trạng thái</th>
                                <th>Phán quyết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map(c => (
                                <tr key={c._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{c.buyer?.name}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 4 }}>{c.buyer?.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{c.seller?.sellerInfo?.shopName || c.seller?.name}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-danger)", marginTop: 4, fontWeight: 500 }}>Uy tín Shop: {c.seller?.sellerInfo?.reputationScore || 0}/5</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: "var(--as-danger)" }}>{c.reason}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 6, background: "rgba(0,0,0,0.02)", padding: "6px 10px", borderRadius: 8, border: "1px solid var(--as-border)", display: "inline-block" }}>
                                            Đơn hàng: <span style={{ fontFamily: "monospace", fontWeight: 600, marginRight: 10 }}>#{c.order?._id.slice(-6).toUpperCase()}</span><br />
                                            G.trị Đơn: <span style={{ fontWeight: 700, color: "var(--as-primary)" }}>{fmt(c.order?.totalPrice)}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: "0.85rem", maxWidth: 280, lineHeight: 1.5 }}>
                                        <div style={{ marginBottom: 10, padding: 8, background: "rgba(239, 68, 68, 0.05)", borderRadius: 8, borderLeft: "3px solid var(--as-danger)" }}>
                                            <span style={{ fontWeight: 700, color: "var(--as-danger)" }}>Buyer mắng:</span> {c.description || "Không có nội dung thêm"}
                                        </div>
                                        {c.sellerResponse ? (
                                            <div style={{ padding: 8, background: "rgba(16, 185, 129, 0.05)", borderRadius: 8, borderLeft: "3px solid var(--as-success)" }}>
                                                <span style={{ fontWeight: 700, color: "var(--as-success)" }}>Seller cãi:</span> {c.sellerResponse}
                                            </div>
                                        ) : (
                                            <div style={{ color: "var(--as-text-muted)", fontStyle: "italic", padding: "0 8px" }}>Seller đang im lặng 😶</div>
                                        )}
                                    </td>
                                    <td>{getStatusBadge(c.status)}</td>
                                    <td>
                                        {c.status === "escalated" ? (
                                            <button
                                                className="as-btn as-btn-danger"
                                                onClick={() => setResolveModal({ show: true, complaint: c, resolution: "buyer_wins", refundAmount: c.order?.totalPrice || 0, adminNote: "" })}
                                                style={{ padding: "8px 12px", fontSize: "0.9rem", width: "100%", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)" }}
                                            >
                                                Mở Tòa Án
                                            </button>
                                        ) : c.status === "resolved" ? (
                                            <div style={{ padding: 12, background: c.resolution === "buyer_wins" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", borderRadius: 12, textAlign: "center" }}>
                                                <div style={{ fontWeight: 700, color: c.resolution === "buyer_wins" ? "var(--as-success)" : "var(--as-danger)" }}>
                                                    {c.resolution === "buyer_wins" ? "🌟 Mua Thắng" : "🛡️ Bán Thắng"}
                                                </div>
                                                {c.resolution === "buyer_wins" && (
                                                    <div style={{ color: "var(--as-text-muted)", fontSize: "0.85rem", marginTop: 4, fontWeight: 600 }}>Hoàn: {fmt(c.refundAmount)}</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: "var(--as-text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>Sân chơi của họ, chưa cãi xong</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Phán quyết Modal */}
            {resolveModal.show && (
                <div className="modal-overlay">
                    <div className="as-card" style={{ maxWidth: 550, width: "100%", padding: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--as-danger)" }}>⚖️ Tòa Án Tối Cao Shopee</h3>
                            <button style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--as-text-muted)" }} onClick={() => setResolveModal({ show: false, complaint: null, resolution: "buyer_wins", refundAmount: 0, adminNote: "" })}>&times;</button>
                        </div>
                        <div style={{ marginBottom: 24, padding: "16px", background: "rgba(0,0,0,0.02)", borderRadius: 12, border: "1px dashed var(--as-border)" }}>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>Bên nào có lý hơn? Quyết định này không thể thay đổi!</div>
                            <select
                                style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", fontSize: "1rem", fontWeight: 500, background: "white" }}
                                value={resolveModal.resolution}
                                onChange={e => setResolveModal({ ...resolveModal, resolution: e.target.value })}
                            >
                                <option value="buyer_wins">Bảo vệ Người Mua (Bắt đền Shop, Hoàn tiền cho Khách)</option>
                                <option value="seller_wins">Bảo vệ Người Bán (Khách hàng sai, Từ chối yêu cầu)</option>
                            </select>
                        </div>

                        {resolveModal.resolution === "buyer_wins" && (
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Số tiền hoàn lại cho Khách (Tối đa {fmt(resolveModal.complaint?.order?.totalPrice)}) *</label>
                                <input
                                    type="number"
                                    style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", fontSize: "1.1rem", fontWeight: 700, color: "var(--as-primary)" }}
                                    min="0"
                                    max={resolveModal.complaint?.order?.totalPrice}
                                    value={resolveModal.refundAmount}
                                    onChange={e => setResolveModal({ ...resolveModal, refundAmount: e.target.value })}
                                />
                                <div style={{ fontSize: "0.85rem", color: "var(--as-danger)", marginTop: 8, fontWeight: 600, padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 8 }}>
                                    ⚠️ Lưu ý: Gian hàng sẽ bị -1 Điểm Uy Tín và ghi nhận vi phạm ngay lập tức.
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: 32 }}>
                            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Ghi chú sổ sách của Admin (Để lưu log)</label>
                            <textarea
                                style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", fontSize: "0.95rem", resize: "vertical" }}
                                rows="3"
                                value={resolveModal.adminNote}
                                onChange={e => setResolveModal({ ...resolveModal, adminNote: e.target.value })}
                                placeholder="Căn cứ theo hình ảnh unbox, shop giao thiếu hàng rành rành..."
                            />
                        </div>

                        <button className="as-btn as-btn-danger" style={{ width: "100%", padding: 14, fontSize: "1.1rem" }} onClick={handleResolve}>
                            Gõ Búa - Chốt Phán Quyết
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
