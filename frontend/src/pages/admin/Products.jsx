import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaCheck, FaBan } from "react-icons/fa";
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
        if (!window.confirm("Duyệt sản phẩm này?")) return;
        try {
            await axiosClient.put(`/api/products/${id}/approve`);
            loadProducts();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi duyệt");
        }
    };

    const handleDeletePermanently = async (id) => {
        if (!window.confirm("XÓA VĨNH VIỄN sản phẩm này? Không thể hoàn tác!")) return;
        try {
            await axiosClient.delete(`/api/products/${id}`);
            loadProducts();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi xóa");
        }
    };

    const submitAction = async () => {
        if (!actionModal.reason.trim()) return alert("Vui lòng nhập lý do");
        try {
            const { productId, action, reason } = actionModal;
            if (action === "reject") {
                await axiosClient.put(`/api/products/${productId}/reject`, { reason });
            } else if (action === "remove") {
                await axiosClient.put(`/api/products/${productId}/remove`, { reason, recordViolation: true });
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
            case "approved":       return <span className="as-badge as-badge-success">Đã duyệt</span>;
            case "rejected":       return <span className="as-badge as-badge-danger">Từ chối</span>;
            case "removed":        return <span className="as-badge as-badge-dark">Bị gỡ vi phạm</span>;
            default:               return <span className="as-badge">{status}</span>;
        }
    };

    const TABS = [
        { key: "pending_review", label: "Chờ duyệt" },
        { key: "approved", label: "Đã duyệt" },
        { key: "rejected", label: "Từ chối" },
        { key: "removed", label: "Vi phạm & Gỡ" },
    ];

    return (
        <div>
            <div className="as-page-header">
                <div className="as-page-header-left">
                    <h1 className="as-page-title">Sản phẩm</h1>
                    <p className="as-page-subtitle">Kiểm duyệt và quản lý sản phẩm đăng bán</p>
                </div>
            </div>

            {/* Filter Tabs */}
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
                ) : products.length === 0 ? (
                    <div className="as-table-empty">Không có sản phẩm nào trong mục này</div>
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
                                        <div className="as-product-cell">
                                            <img src={p.images?.[0] || "/placeholder.png"} className="as-product-img" alt={p.name} />
                                            <div>
                                                <div className="as-product-name">{p.name}</div>
                                                <div className="as-product-sub">{p.category}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.seller?.sellerInfo?.shopName || p.seller?.name}</div>
                                        <div className="as-text-sm as-text-muted-c" style={{ marginTop: 3 }}>{p.seller?.email}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: "var(--as-primary)", fontSize: "0.92rem" }}>{fmt(p.price)}</div>
                                        <div className="as-text-sm as-text-muted-c" style={{ marginTop: 3 }}>
                                            Kho: <span style={{ fontWeight: 600 }}>{p.stock}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {getStatusBadge(p.status)}
                                        {(p.status === "rejected" || p.status === "removed") && p.rejectedReason && (
                                            <div style={{ fontSize: "0.78rem", color: "var(--as-danger-dark)", marginTop: 5, lineHeight: 1.4, maxWidth: 180 }}>
                                                {p.rejectedReason}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 120 }}>
                                            {p.status === "pending_review" && (
                                                <>
                                                    <button className="as-btn as-btn-sm as-btn-success" style={{ width: "100%" }} onClick={() => handleApprove(p._id)}>
                                                        <FaCheck size={10} /> Duyệt
                                                    </button>
                                                    <button
                                                        className="as-btn as-btn-sm as-btn-outline"
                                                        style={{ width: "100%", borderColor: "var(--as-danger)", color: "var(--as-danger-dark)" }}
                                                        onClick={() => setActionModal({ show: true, productId: p._id, action: "reject", reason: "" })}
                                                    >
                                                        Từ chối
                                                    </button>
                                                </>
                                            )}
                                            {p.status === "approved" && (
                                                <button
                                                    className="as-btn as-btn-sm as-btn-outline"
                                                    style={{ width: "100%", borderColor: "var(--as-danger)", color: "var(--as-danger-dark)" }}
                                                    onClick={() => setActionModal({ show: true, productId: p._id, action: "remove", reason: "" })}
                                                >
                                                    <FaBan size={10} /> Gỡ SP
                                                </button>
                                            )}
                                            <button
                                                className="as-btn as-btn-sm"
                                                style={{ background: "rgba(244,63,94,0.06)", color: "var(--as-danger-dark)", border: "1px solid rgba(244,63,94,0.15)", width: "100%" }}
                                                onClick={() => handleDeletePermanently(p._id)}
                                                title="Xóa vĩnh viễn"
                                            >
                                                <FaTrash size={10} /> Xóa vĩnh viễn
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Action Modal (Reject / Remove) */}
            {actionModal.show && (
                <div className="modal-overlay">
                    <div className="as-modal" style={{ maxWidth: 460 }}>
                        <div className="as-modal-header">
                            <h3 className="as-modal-title" style={{ color: "var(--as-danger-dark)" }}>
                                {actionModal.action === "reject" ? "Từ chối sản phẩm" : "Gỡ sản phẩm vi phạm"}
                            </h3>
                            <button className="as-modal-close" onClick={() => setActionModal({ show: false, productId: null, action: "", reason: "" })}>×</button>
                        </div>
                        {actionModal.action === "remove" && (
                            <div className="as-alert as-alert-danger" style={{ marginBottom: 16 }}>
                                ⚠️ Thao tác này sẽ gỡ sản phẩm và ghi nhận <strong>+1 vi phạm</strong> cho gian hàng!
                            </div>
                        )}
                        <div className="as-form-group">
                            <label className="as-form-label">Lý do <span className="required">*</span></label>
                            <textarea
                                className="as-textarea"
                                rows="4"
                                placeholder={actionModal.action === "reject" ? "Nhập lý do để seller sửa lại..." : "Nêu rõ vi phạm (hàng giả, nội dung phản cảm...)"}
                                value={actionModal.reason}
                                onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                            />
                        </div>
                        <div className="as-modal-footer">
                            <button className="as-btn as-btn-outline" onClick={() => setActionModal({ show: false, productId: null, action: "", reason: "" })}>Hủy</button>
                            <button className="as-btn as-btn-danger" onClick={submitAction}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
