import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaTag, FaPlus, FaTrash } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function SellerVouchers() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: "", name: "", type: "fixed", value: "", minOrderValue: "0", maxUses: "", startDate: "", endDate: "" });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        loadVouchers();
    }, [user, navigate]);

    const loadVouchers = async () => {
        try {
            const res = await axiosClient.get("/api/vouchers?scope=shop");
            setVouchers(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axiosClient.post("/api/vouchers", {
                ...form,
                value: Number(form.value),
                minOrderValue: Number(form.minOrderValue),
                maxUses: form.maxUses ? Number(form.maxUses) : null
            });
            alert("Đã tạo Voucher của Shop thành công!");
            setShowForm(false);
            setForm({ code: "", name: "", type: "fixed", value: "", minOrderValue: "0", maxUses: "", startDate: "", endDate: "" });
            loadVouchers();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi tạo voucher");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa Voucher này?")) return;
        try {
            await axiosClient.delete(`/api/vouchers/${id}`);
            setVouchers(vouchers.filter(v => v._id !== id));
        } catch {
            alert("Lỗi xóa voucher");
        }
    };

    const handleToggleActive = async (id, currentActive) => {
        try {
            const res = await axiosClient.put(`/api/vouchers/${id}`, { isActive: !currentActive });
            setVouchers(vouchers.map(v => v._id === id ? res.data : v));
        } catch {
            alert("Cập nhật thất bại");
        }
    };

    const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", fontSize: "0.95rem", background: "white" };
    const labelStyle = { display: "block", marginBottom: 8, fontWeight: 600, color: "var(--as-text)", fontSize: "0.9rem" };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ margin: 0 }}>Mã Giảm Giá Của Shop (Vouchers)</h1>
                <button className="as-btn as-btn-primary" onClick={() => setShowForm(v => !v)}>
                    <FaPlus style={{ marginRight: 8 }} /> Tạo Voucher
                </button>
            </div>

            {showForm && (
                <div className="as-card" style={{ padding: 32, marginBottom: 24, background: "linear-gradient(to bottom right, #ffffff, #f8fafc)", border: "1px solid rgba(59, 130, 246, 0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem", color: "var(--as-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                            <FaTag /> Tạo Voucher Mới Cho Shop
                        </h3>
                        <button style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--as-text-muted)" }} onClick={() => setShowForm(false)}>&times;</button>
                    </div>

                    <form onSubmit={handleCreate}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div>
                                <label style={labelStyle}>Mã Code (Tự nhập) <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <input required style={{ ...inputStyle, textTransform: "uppercase", fontWeight: 700, color: "var(--as-primary)", letterSpacing: 1 }} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="VD: MYSHOP10K" />
                            </div>
                            <div>
                                <label style={labelStyle}>Tên hiển thị <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <input required style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Giảm 10k cho đơn 150k" />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div>
                                <label style={labelStyle}>Loại giảm giá <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="fixed">Tiền mặt (VNĐ)</option>
                                    <option value="percentage">Phần trăm (%)</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Mức giảm <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <input required type="number" min="1" style={inputStyle} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="10000 hoặc 10" />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div>
                                <label style={labelStyle}>Đơn Tối Thiểu (₫)</label>
                                <input type="number" min="0" style={inputStyle} value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Số Lượng Lượt Dùng</label>
                                <input type="number" min="1" style={inputStyle} value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} placeholder="Để trống = Vô hạn" />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                            <div>
                                <label style={labelStyle}>Bắt đầu <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <input required type="datetime-local" style={inputStyle} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label style={labelStyle}>Kết thúc <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <input required type="datetime-local" style={inputStyle} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button type="submit" className="as-btn as-btn-primary" style={{ padding: "12px 24px", flex: 1 }} disabled={submitting}>{submitting ? "Đang tạo..." : "Xác nhận Lưu Voucher"}</button>
                            <button type="button" className="as-btn as-btn-outline" style={{ padding: "12px 24px" }} onClick={() => setShowForm(false)}>Đóng</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="as-table-wrapper">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>
                ) : vouchers.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", background: "white", borderRadius: 16 }}>
                        <div style={{ fontSize: "3rem", marginBottom: 16 }}><FaTag color="var(--as-border)" /></div>
                        <h3 style={{ margin: "0 0 16px 0", color: "var(--as-text)" }}>Chưa có mã giảm giá nào</h3>
                    </div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Thông tin Voucher</th>
                                <th>Mức giảm</th>
                                <th>Đơn tối thiểu</th>
                                <th>Đã dùng / Tổng</th>
                                <th>Thời hạn áp dụng</th>
                                <th>Hiệu lực</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.map(v => (
                                <tr key={v._id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: "var(--as-primary)", fontSize: "1.1rem", marginBottom: 4 }}>{v.code}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)" }}>{v.name}</div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: "var(--as-danger)", fontSize: "1.05rem" }}>
                                        {v.type === "percentage" ? `Giảm ${v.value}%` : `Giảm ${fmt(v.value)}`}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{fmt(v.minOrderValue)}</td>
                                    <td>
                                        <div style={{ background: "rgba(0,0,0,0.03)", padding: "4px 8px", borderRadius: 8, display: "inline-block", fontWeight: 600, fontSize: "0.9rem" }}>
                                            <span style={{ color: "var(--as-primary)" }}>{v.usedCount}</span> / {v.maxUses === null ? "∞" : v.maxUses}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: "0.85rem", color: "var(--as-text)" }}>
                                            <div style={{ marginBottom: 4 }}><span style={{ color: "var(--as-success)", fontWeight: 600, marginRight: 6 }}>Từ:</span>{new Date(v.startDate).toLocaleDateString("vi-VN")}</div>
                                            <div><span style={{ color: "var(--as-danger)", fontWeight: 600, marginRight: 6 }}>Tới:</span>{new Date(v.endDate).toLocaleDateString("vi-VN")}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", gap: 8 }}>
                                            <div style={{ position: "relative", width: 44, height: 24, background: v.isActive ? "var(--as-success)" : "#cbd5e1", borderRadius: 20, transition: "0.3s" }}>
                                                <div style={{ position: "absolute", width: 18, height: 18, background: "white", borderRadius: "50%", top: 3, left: v.isActive ? 23 : 3, transition: "0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}></div>
                                                <input
                                                    type="checkbox"
                                                    checked={v.isActive}
                                                    onChange={() => handleToggleActive(v._id, v.isActive)}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                            </div>
                                            <span style={{ fontSize: "0.85rem", color: v.isActive ? "var(--as-success)" : "var(--as-text-muted)", fontWeight: 600 }}>
                                                {v.isActive ? "Đang Bật" : "Đã Tắt"}
                                            </span>
                                        </label>
                                    </td>
                                    <td>
                                        <button className="as-btn as-btn-outline" onClick={() => handleDelete(v._id)} style={{ padding: "8px", borderColor: "var(--as-danger)", color: "var(--as-danger)", background: "rgba(239, 68, 68, 0.05)" }} title="Xóa vĩnh viễn">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
