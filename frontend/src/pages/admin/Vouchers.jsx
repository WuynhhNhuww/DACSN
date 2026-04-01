import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrash } from "react-icons/fa";
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
            alert("Xóa thành công.");
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
            alert("Tạo Voucher toàn sàn thành công!");
            setShowModal(false);
            setFormData({ code: "", name: "", type: "percentage", value: "", minOrderValue: "0", maxUses: "", startDate: "", endDate: "" });
            loadVouchers();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi tạo voucher");
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Mã Giảm Giá Toàn Sàn</h1>
                <button className="as-btn as-btn-primary" onClick={() => setShowModal(true)}>
                    <FaPlus /> Tạo Voucher
                </button>
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>
                ) : vouchers.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--as-text-muted)" }}>Chưa có voucher toàn sàn nào</div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Mã / Tên chương trình</th>
                                <th>Khuyến mãi</th>
                                <th>Đơn Tối Thiểu</th>
                                <th>Thời hạn</th>
                                <th>Lượt dùng</th>
                                <th>Trạng thái</th>
                                <th>Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.map(v => (
                                <tr key={v._id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: "var(--as-primary)", fontSize: "1.1rem" }}>{v.code}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", marginTop: 4 }}>{v.name}</div>
                                    </td>
                                    <td style={{ fontWeight: 600, color: "var(--as-success)" }}>
                                        {v.type === "percentage" ? `Giảm ${v.value}%` : `Giảm ${fmt(v.value)}`}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{fmt(v.minOrderValue)}</td>
                                    <td style={{ fontSize: "0.85rem", color: "var(--as-text-muted)" }}>
                                        {new Date(v.startDate).toLocaleDateString("vi-VN")} - {new Date(v.endDate).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td>
                                        {v.usedCount} / <span style={{ fontWeight: v.maxUses === null ? "normal" : "600" }}>{v.maxUses === null ? "Vô hạn" : v.maxUses}</span>
                                    </td>
                                    <td>
                                        <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", gap: 8 }}>
                                            <div style={{ position: "relative", width: 36, height: 20, background: v.isActive ? "var(--as-primary)" : "#cbd5e1", borderRadius: 20, transition: "0.3s" }}>
                                                <div style={{ position: "absolute", width: 16, height: 16, background: "white", borderRadius: "50%", top: 2, left: v.isActive ? 18 : 2, transition: "0.3s" }}></div>
                                                <input
                                                    type="checkbox"
                                                    checked={v.isActive}
                                                    onChange={() => handleToggleActive(v._id, v.isActive)}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                            </div>
                                            <span style={{ fontSize: "0.9rem", color: v.isActive ? "var(--as-primary)" : "var(--as-text-muted)", fontWeight: 500 }}>
                                                {v.isActive ? "Bật" : "Tắt"}
                                            </span>
                                        </label>
                                    </td>
                                    <td>
                                        <button className="as-btn-outline" onClick={() => handleDelete(v._id)} style={{ color: "var(--as-danger)", padding: "8px", borderRadius: 8, border: "none", background: "rgba(239, 68, 68, 0.05)" }} title="Xóa">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Voucher Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="as-card" style={{ maxWidth: 600, width: "100%", padding: 32 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                            <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Tạo Voucher Toàn Sàn</h3>
                            <button style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--as-text-muted)" }} onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Mã Voucher (Code) *</label>
                                    <input style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--as-border)", textTransform: "uppercase" }} required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Tên chương trình *</label>
                                    <input style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--as-border)" }} required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Loại giảm *</label>
                                    <select style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--as-border)", background: "white" }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="percentage">% Phần trăm</option>
                                        <option value="fixed">₫ Tiền mặt</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Giá trị giảm *</label>
                                    <input style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--as-border)" }} type="number" min="1" required value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Đơn tối thiểu (₫)</label>
                                    <input style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--as-border)" }} type="number" min="0" value={formData.minOrderValue} onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Giới hạn lượt dùng</label>
                                    <input style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--as-border)" }} type="number" min="1" placeholder="Để trống = Không giới hạn" value={formData.maxUses} onChange={e => setFormData({ ...formData, maxUses: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Bắt đầu từ *</label>
                                    <input style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--as-border)", background: "white" }} type="datetime-local" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Kết thúc vào *</label>
                                    <input style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--as-border)", background: "white" }} type="datetime-local" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>

                            <button type="submit" className="as-btn as-btn-primary" style={{ width: "100%", padding: 14 }}>
                                Xác nhận Tạo Voucher
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
