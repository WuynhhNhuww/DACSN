import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function AdminProducts() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("pending_review");

    const [actionModal, setActionModal] = useState({ show: false, productId: null, action: "", reason: "" });

    useEffect(() => {
        if (!user || user.role !== "admin") return navigate("/");
        loadProducts();
    }, [user, navigate, filterStatus]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const endpoint = filterStatus === "pending_review"
                ? "/api/products/admin/pending"
                : `/api/products/admin/all?status=${filterStatus}`;
            const res = await axiosClient.get(endpoint);
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Duyệt sản phẩm này cho phép hiển thị trên hệ thống?")) return;
        try {
            await axiosClient.put(`/api/products/${id}/approve`);
            alert("Đã duyệt sản phẩm!");
            loadProducts();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi duyệt");
        }
    };

    const submitAction = async () => {
        if (!actionModal.reason.trim()) return alert("Vui lòng nhập lý do");

        try {
            const { productId, action, reason } = actionModal;
            if (action === "reject") {
                await axiosClient.put(`/api/products/${productId}/reject`, { reason });
                alert("Đã từ chối sản phẩm.");
            } else if (action === "remove") {
                await axiosClient.put(`/api/products/${productId}/remove`, { reason, recordViolation: true });
                alert("Đã gỡ sản phẩm và ghi nhận vi phạm cho gian hàng.");
            }
            setActionModal({ show: false, productId: null, action: "", reason: "" });
            loadProducts();
        } catch (err) {
            alert(err.response?.data?.message || "Thao tác thất bại");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending_review": return <span className="as-badge as-badge-warning">Chờ duyệt</span>;
            case "approved": return <span className="as-badge as-badge-success">Đã duyệt</span>;
            case "rejected": return <span className="as-badge as-badge-danger">Từ chối</span>;
            case "removed": return <span className="as-badge as-badge-neutral" style={{ background: "#1f2937", color: "white" }}>Bị gỡ vi phạm</span>;
            default: return <span className="as-badge">{status}</span>;
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Quản lý Sản phẩm</h1>
            </div>

            {/* Filter tabs */}
            <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
                {["pending_review", "approved", "rejected", "removed"].map(status => (
                    <button
                        key={status}
                        className={`as-btn ${filterStatus === status ? "as-btn-primary" : "as-btn-outline"}`}
                        onClick={() => setFilterStatus(status)}
                        style={{ padding: "8px 16px", borderRadius: 20 }}
                    >
                        {status === "pending_review" ? "Chờ duyệt" :
                            status === "approved" ? "Đã duyệt" :
                                status === "rejected" ? "Xóa / Từ chối" : "Bị gỡ vi phạm"}
                    </button>
                ))}
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>
                ) : products.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--as-text-muted)" }}>Không có sản phẩm nào</div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Gian hàng</th>
                                <th>Giá / Kho</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p._id}>
                                    <td>
                                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                            <img src={p.images[0] || "/placeholder.png"} alt={p.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--as-border)" }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: "0.95rem", maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                                                <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 4 }}>{p.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{p.seller?.sellerInfo?.shopName || p.seller?.name}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 4 }}>{p.seller?.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ color: "var(--as-primary)", fontWeight: 600 }}>{fmt(p.price)}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 4 }}>Kho: {p.stock}</div>
                                    </td>
                                    <td>
                                        {getStatusBadge(p.status)}
                                        {(p.status === "rejected" || p.status === "removed") && p.rejectedReason && (
                                            <div style={{ fontSize: "0.8rem", color: "var(--as-danger)", marginTop: 6, maxWidth: 180, lineHeight: 1.4 }}>
                                                Lý do: {p.rejectedReason}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {p.status === "pending_review" ? (
                                            <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                                                <button className="as-btn as-btn-primary" onClick={() => handleApprove(p._id)} style={{ padding: "6px 12px", fontSize: "0.85rem", width: "100%" }}>
                                                    Duyệt
                                                </button>
                                                <button
                                                    className="as-btn as-btn-outline"
                                                    onClick={() => setActionModal({ show: true, productId: p._id, action: "reject", reason: "" })}
                                                    style={{ padding: "6px 12px", fontSize: "0.85rem", borderColor: "var(--as-danger)", color: "var(--as-danger)", width: "100%" }}
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        ) : p.status === "approved" ? (
                                            <button
                                                className="as-btn as-btn-outline"
                                                onClick={() => setActionModal({ show: true, productId: p._id, action: "remove", reason: "" })}
                                                style={{ padding: "6px 12px", borderColor: "var(--as-danger)", color: "var(--as-danger)" }}
                                                title="Gỡ do vi phạm"
                                            >
                                                <FaTrash style={{ marginRight: 6 }} /> Gỡ SP
                                            </button>
                                        ) : (
                                            <span style={{ color: "var(--as-text-muted)", fontSize: "0.9rem" }}>Không có</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Nhập lý do (Từ chối / Gỡ) */}
            {actionModal.show && (
                <div className="modal-overlay">
                    <div className="as-card" style={{ maxWidth: 450, width: "100%", padding: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--as-danger)" }}>{actionModal.action === "reject" ? "Từ chối sản phẩm" : "Gỡ sản phẩm vi phạm"}</h3>
                            <button style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--as-text-muted)" }} onClick={() => setActionModal({ show: false, productId: null, action: "", reason: "" })}>&times;</button>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Lý do <span style={{ color: "red" }}>*</span></label>
                            <textarea
                                style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid var(--as-border)", outline: "none", resize: "vertical", fontSize: "0.95rem" }}
                                rows="4"
                                placeholder={actionModal.action === "reject" ? "Nhập lý do để seller sửa lại..." : "Nêu rõ vi phạm (rượu bia, hàng giả...). Thao tác này sẽ khóa SP và cộng 1 vi phạm cho shop!"}
                                value={actionModal.reason}
                                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                            ></textarea>
                        </div>
                        <button className="as-btn as-btn-danger" style={{ width: "100%" }} onClick={submitAction}>
                            {actionModal.action === "reject" ? "Xác nhận Từ chối" : "Xác nhận Gỡ & Ghi tạc Vi phạm"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
