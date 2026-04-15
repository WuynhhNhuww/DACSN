import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaTag } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function AdminVouchers() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: "", name: "", type: "percentage", value: "",
        minOrderValue: "0", maxUses: "", startDate: "", endDate: ""
    });

    useEffect(() => {
        if (!user || user.role !== "admin") return navigate("/");
        loadVouchers();
    }, [user, navigate]);

    const loadVouchers = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get("/api/vouchers?scope=platform");
            setVouchers(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa voucher này?")) return;
        try {
            await axiosClient.delete(`/api/vouchers/${id}`);
            setVouchers(vouchers.filter(v => v._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Xóa thất bại");
        }
    };

    const handleToggleActive = async (id, currentActive) => {
        try {
            const res = await axiosClient.put(`/api/vouchers/${id}`, { isActive: !currentActive });
            setVouchers(vouchers.map(v => v._id === id ? res.data : v));
        } catch (err) {
            alert("Cập nhật thất bại");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                value: Number(formData.value),
                minOrderValue: Number(formData.minOrderValue),
                maxUses: formData.maxUses ? Number(formData.maxUses) : null
            };
            await axiosClient.post("/api/vouchers", payload);
            setShowModal(false);
            setFormData({ code: "", name: "", type: "percentage", value: "", minOrderValue: "0", maxUses: "", startDate: "", endDate: "" });
            loadVouchers();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi tạo voucher");
        }
    };

    return (
        <div>
            <div className="as-page-header">
                <div className="as-page-header-left">
                    <h1 className="as-page-title">Mã Giảm Giá Toàn Sàn</h1>
                    <p className="as-page-subtitle">Tạo và quản lý các voucher do Shopee Mini phát hành</p>
                </div>
                <button className="as-btn as-btn-primary" onClick={() => setShowModal(true)}>
                    <FaPlus size={12} /> Tạo Voucher
                </button>
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div className="as-table-loading"><div className="as-spinner" /><span>Đang tải dữ liệu...</span></div>
                ) : vouchers.length === 0 ? (
                    <div className="as-table-empty">
                        <FaTag style={{ fontSize: "2rem", color: "var(--as-border-strong)", marginBottom: 12 }} />
                        <div>Chưa có voucher toàn sàn nào</div>
                    </div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Mã / Tên chương trình</th>
                                <th>Khuyến mãi</th>
                                <th>Đơn tối thiểu</th>
                                <th>Thời hạn</th>
                                <th>Lượt dùng</th>
                                <th>Trạng thái</th>
                                <th className="as-text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.map(v => (
                                <tr key={v._id}>
                                    <td>
                                        <div style={{ fontWeight: 800, color: "var(--as-primary)", fontSize: "1.05rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>{v.code}</div>
                                        <div className="as-text-sm as-text-muted-c" style={{ marginTop: 3 }}>{v.name}</div>
                                    </td>
                                    <td>
                                        <span className="as-badge as-badge-success" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
                                            {v.type === "percentage" ? `Giảm ${v.value}%` : `Giảm ${fmt(v.value)}`}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{fmt(v.minOrderValue)}</td>
                                    <td className="as-text-sm as-text-muted-c">
                                        <div>{new Date(v.startDate).toLocaleDateString("vi-VN")}</div>
                                        <div style={{ marginTop: 2 }}>đến {new Date(v.endDate).toLocaleDateString("vi-VN")}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--as-bg)", padding: "4px 10px", borderRadius: 8 }}>
                                            <span style={{ fontWeight: 600 }}>{v.usedCount}</span>
                                            <span style={{ color: "var(--as-text-muted)" }}>/</span>
                                            <span style={{ color: "var(--as-text-muted)", fontSize: "0.85rem" }}>{v.maxUses === null ? "∞" : v.maxUses}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <label className="as-toggle">
                                            <input
                                                type="checkbox"
                                                checked={v.isActive}
                                                onChange={() => handleToggleActive(v._id, v.isActive)}
                                            />
                                            <div className="as-toggle-track"><div className="as-toggle-thumb"></div></div>
                                            <span className="as-toggle-label" style={{ color: v.isActive ? "var(--as-primary)" : "var(--as-text-muted)", fontWeight: 600 }}>
                                                {v.isActive ? "Đang bật" : "Đã tắt"}
                                            </span>
                                        </label>
                                    </td>
                                    <td className="as-text-right">
                                        <button className="as-btn-ghost as-btn-icon" onClick={() => handleDelete(v._id)} title="Xóa voucher" style={{ color: "var(--as-danger-dark)" }}>
                                            <FaTrash size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="as-modal" style={{ maxWidth: 640 }}>
                        <div className="as-modal-header">
                            <h3 className="as-modal-title">Tạo Voucher Toàn Sàn</h3>
                            <button className="as-modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="as-form-grid as-mb-16">
                                <div className="as-form-group">
                                    <label className="as-form-label">Mã Voucher (Code) <span className="required">*</span></label>
                                    <input className="as-input" required placeholder="Ví dụ: FREESHIP, WPN20..." style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }} value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="as-form-group">
                                    <label className="as-form-label">Tên chương trình <span className="required">*</span></label>
                                    <input className="as-input" required placeholder="Siêu sale giữa tháng..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                            </div>

                            <div className="as-form-grid as-mb-16">
                                <div className="as-form-group">
                                    <label className="as-form-label">Loại giảm giá <span className="required">*</span></label>
                                    <select className="as-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="percentage">Giảm theo phần trăm (%)</option>
                                        <option value="fixed">Giảm số tiền mặt (₫)</option>
                                    </select>
                                </div>
                                <div className="as-form-group">
                                    <label className="as-form-label">Giá trị giảm <span className="required">*</span></label>
                                    <input className="as-input" type="number" min="1" required placeholder={formData.type === "percentage" ? "10%" : "20000"} value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                                </div>
                            </div>

                            <div className="as-form-grid as-mb-16">
                                <div className="as-form-group">
                                    <label className="as-form-label">Đơn tối thiểu (₫)</label>
                                    <input className="as-input" type="number" min="0" value={formData.minOrderValue} onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })} />
                                </div>
                                <div className="as-form-group">
                                    <label className="as-form-label">Giới hạn lượt dùng</label>
                                    <input className="as-input" type="number" min="1" placeholder="Để trống nếu Vô hạn" value={formData.maxUses} onChange={e => setFormData({ ...formData, maxUses: e.target.value })} />
                                </div>
                            </div>

                            <div className="as-form-grid as-mb-24">
                                <div className="as-form-group">
                                    <label className="as-form-label">Thời gian bắt đầu <span className="required">*</span></label>
                                    <input className="as-input" type="datetime-local" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div className="as-form-group">
                                    <label className="as-form-label">Thời gian kết thúc <span className="required">*</span></label>
                                    <input className="as-input" type="datetime-local" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="as-modal-footer">
                                <button type="button" className="as-btn as-btn-outline" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="as-btn as-btn-primary">Tạo Voucher</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
