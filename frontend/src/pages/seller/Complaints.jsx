import { useState, useEffect, useContext } from "react";
import { FaExclamationTriangle, FaCheckCircle, FaReply, FaSearch, FaCommentDots } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

export default function SellerComplaints() {
    const { user } = useContext(AuthContext) || {};
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(null); // id of complaint
    const [responseMsg, setResponseMsg] = useState("");
    const [proposedRefundAmount, setProposedRefundAmount] = useState(0);

    useEffect(() => {
        if (!user) return;
        loadComplaints();
    }, [user]);

    const loadComplaints = async () => {
        try {
            const res = await axiosClient.get("/api/complaints");
            setComplaints(res.data || []);
        } catch (error) {
            console.error("Lỗi tải khiếu nại:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (id) => {
        if (!responseMsg.trim()) return alert("Vui lòng nhập phản hồi.");
        if (proposedRefundAmount < 0) return alert("Số tiền đền bù không hợp lệ.");

        try {
            await axiosClient.put(`/api/complaints/${id}/seller-respond`, {
                response: responseMsg,
                proposedRefundAmount: proposedRefundAmount
            });
            setResponding(null);
            setResponseMsg("");
            setProposedRefundAmount(0);
            loadComplaints();
        } catch (err) {
            alert(err?.response?.data?.message || "Lỗi khi phản hồi");
        }
    };

    const statusBadge = (s) => {
        switch (s) {
            case "open": return <span className="as-badge as-badge-danger">Mới</span>;
            case "seller_processing": return <span className="as-badge as-badge-warning">Đang xử lý</span>;
            case "escalated": return <span className="as-badge" style={{ background: "#f97316", color: "white" }}>Admin can thiệp</span>;
            case "resolved": return <span className="as-badge as-badge-success">Đã giải quyết</span>;
            default: return <span className="as-badge">{s}</span>;
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Quản lý Khiếu nại</h1>
            </div>

            <div className="as-card" style={{ padding: 24 }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: 40 }}>Đang tải dữ liệu...</div>
                ) : complaints.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, color: "var(--as-text-muted)" }}>
                        <div style={{ fontSize: 40, marginBottom: 16 }}>😊</div>
                        <h3>Chưa có khiếu nại nào</h3>
                        <p>Shop của bạn đang hoạt động rất tốt!</p>
                    </div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Khách hàng</th>
                                <th>Lý do</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map(c => (
                                <tr key={c._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{c.buyer?.name}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)" }}>{c.buyer?.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: "var(--as-danger)" }}>{c.reason}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", maxWidth: 300 }}>{c.description}</div>
                                        {c.evidenceImages && c.evidenceImages.length > 0 && (
                                            <div style={{ marginTop: 8 }}>
                                                <a href={c.evidenceImages[0]} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--as-primary)", textDecoration: "underline", display: "inline-block" }}>
                                                    📄 Xem ảnh bằng chứng
                                                </a>
                                            </div>
                                        )}
                                    </td>
                                    <td>{statusBadge(c.status)}</td>
                                    <td>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                                    <td>
                                        {c.status === "open" ? (
                                            <button className="as-btn as-btn-primary as-btn-sm" onClick={() => setResponding(c._id)}>
                                                <FaReply style={{ marginRight: 6 }} /> Phản hồi
                                            </button>
                                        ) : c.sellerResponse ? (
                                            <div style={{ fontSize: "0.85rem", background: "rgba(0,0,0,0.03)", padding: 8, borderRadius: 8 }}>
                                                <strong>Shop:</strong> {c.sellerResponse}
                                                <div style={{ marginTop: 4, color: "var(--as-primary)", fontWeight: 600 }}>Tỷ lệ đề xuất đền bù: ₫{Number(c.proposedRefundAmount || 0).toLocaleString("vi-VN")}</div>
                                                {c.buyerAccepted === true && <div style={{ marginTop: 4, color: "#10b981", fontWeight: 700 }}>✅ Khách đã đồng ý</div>}
                                                {c.buyerAccepted === false && <div style={{ marginTop: 4, color: "#f43f5e", fontWeight: 700 }}>❌ Khách không đồng ý, đã nhờ Admin.</div>}
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: "0.85rem", color: "var(--as-text-muted)" }}>Không thể phản hồi</span>
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
                        <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><FaReply /> Phản hồi khách hàng</h3>
                        <p style={{ fontSize: "0.9rem", color: "var(--as-text-muted)", marginBottom: 16 }}>Nêu rõ phương án giải quyết (đổi trả, hoàn tiền, đền bù bù trừ...).</p>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Nội dung phản hồi</label>
                            <textarea
                                className="as-input"
                                style={{ width: "100%", height: 100, resize: "none" }}
                                placeholder="Nhập nội dung phản hồi..."
                                value={responseMsg}
                                onChange={e => setResponseMsg(e.target.value)}
                            />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Số tiền đề xuất đền bù (VND)</label>
                            <input
                                type="number"
                                className="as-input"
                                style={{ width: "100%" }}
                                placeholder="Ví dụ: 50000"
                                value={proposedRefundAmount}
                                onChange={e => setProposedRefundAmount(Number(e.target.value))}
                            />
                            <p style={{ fontSize: 11, color: "var(--as-text-muted)", marginTop: 6 }}>Nếu không chấp nhận đền bù, hãy nhập 0. Khách hàng sẽ xem và có quyền nhờ Admin can thiệp nếu không đạt được thỏa thuận.</p>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                            <button className="as-btn as-btn-outline" onClick={() => { setResponding(null); setResponseMsg(""); setProposedRefundAmount(0); }}>Hủy</button>
                            <button className="as-btn as-btn-primary" onClick={() => handleRespond(responding)}>Gửi đề xuất</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
