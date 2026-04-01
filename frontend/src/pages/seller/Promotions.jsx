import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import SellerSidebar from "../../components/SellerSidebar";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function SellerPromotions() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", type: "percentage", value: "", startTime: "", endTime: "", isActive: true });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        load();
    }, [user]);

    const load = () => {
        axiosClient.get("/api/promotions/my")
            .then(res => setPromos(res.data || []))
            .catch(() => setPromos([]))
            .finally(() => setLoading(false));
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.name || !form.value || !form.startTime || !form.endTime)
            return setError("Vui lòng điền đầy đủ thông tin.");
        setSaving(true);
        try {
            await axiosClient.post("/api/promotions", {
                name: form.name, type: form.type,
                value: Number(form.value),
                startTime: form.startTime, endTime: form.endTime,
                isActive: form.isActive,
            });
            setShowForm(false);
            setForm({ name: "", type: "percentage", value: "", startTime: "", endTime: "", isActive: true });
            load();
        } catch (err) {
            setError(err?.response?.data?.message || "Tạo thất bại.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa chương trình khuyến mãi này?")) return;
        try {
            await axiosClient.delete(`/api/promotions/${id}`);
            setPromos(prev => prev.filter(p => p._id !== id));
        } catch {
            alert("Xóa thất bại.");
        }
    };

    const toggleActive = async (promo) => {
        try {
            await axiosClient.put(`/api/promotions/${promo._id}`, { isActive: !promo.isActive });
            setPromos(prev => prev.map(p => p._id === promo._id ? { ...p, isActive: !p.isActive } : p));
        } catch { }
    };

    return (
        <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 40 }}>
            <div className="container">
                <div className="dashLayout">
                    <SellerSidebar />
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 16px" }}>
                            <h1 className="pageTitle" style={{ margin: 0 }}>Chương trình khuyến mãi</h1>
                            <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
                                <FaPlus /> Tạo khuyến mãi
                            </button>
                        </div>

                        {/* Create Form */}
                        {showForm && (
                            <div className="card" style={{ marginBottom: 14 }}>
                                <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Tạo chương trình mới</h3>
                                {error && <div className="alert alert-error">{error}</div>}
                                <form onSubmit={handleCreate}>
                                    <div className="formGrid">
                                        <div className="formGroup">
                                            <label className="formLabel">Tên chương trình *</label>
                                            <input className="formControl" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Flash Sale 10.10..." />
                                        </div>
                                        <div className="formGroup">
                                            <label className="formLabel">Loại giảm giá</label>
                                            <select className="formControl" value={form.type} onChange={e => set("type", e.target.value)}>
                                                <option value="percentage">Phần trăm (%)</option>
                                                <option value="fixed">Cố định (₫)</option>
                                            </select>
                                        </div>
                                        <div className="formGroup">
                                            <label className="formLabel">Giá trị giảm *</label>
                                            <input className="formControl" type="number" min={0} value={form.value} onChange={e => set("value", e.target.value)}
                                                placeholder={form.type === "percentage" ? "VD: 20 (20%)" : "VD: 50000 (₫50,000)"} />
                                        </div>
                                        <div className="formGroup">
                                            <label className="formLabel">Trạng thái</label>
                                            <select className="formControl" value={form.isActive} onChange={e => set("isActive", e.target.value === "true")}>
                                                <option value="true">Đang kích hoạt</option>
                                                <option value="false">Tắt</option>
                                            </select>
                                        </div>
                                        <div className="formGroup">
                                            <label className="formLabel">Bắt đầu *</label>
                                            <input className="formControl" type="datetime-local" value={form.startTime} onChange={e => set("startTime", e.target.value)} />
                                        </div>
                                        <div className="formGroup">
                                            <label className="formLabel">Kết thúc *</label>
                                            <input className="formControl" type="datetime-local" value={form.endTime} onChange={e => set("endTime", e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Đang tạo..." : "Tạo khuyến mãi"}</button>
                                        <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Hủy</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* List */}
                        <div className="tableWrap">
                            <div className="tableHeader"><h3>{promos.length} chương trình</h3></div>
                            {loading ? (
                                <div className="loading">Đang tải...</div>
                            ) : promos.length === 0 ? (
                                <div className="emptyState" style={{ padding: "40px 20px" }}>
                                    <div className="icon">🏷️</div>
                                    <h3>Chưa có chương trình khuyến mãi</h3>
                                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>Tạo ngay</button>
                                </div>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Tên chương trình</th>
                                            <th>Loại giảm</th>
                                            <th>Giá trị</th>
                                            <th>Thời gian</th>
                                            <th>Trạng thái</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {promos.map(p => (
                                            <tr key={p._id}>
                                                <td style={{ fontWeight: 600 }}>{p.name}</td>
                                                <td>{p.type === "percentage" ? "Phần trăm" : "Cố định"}</td>
                                                <td style={{ color: "var(--shopee)", fontWeight: 700 }}>
                                                    {p.type === "percentage" ? `${p.value}%` : fmt(p.value)}
                                                </td>
                                                <td style={{ fontSize: 12, color: "#666" }}>
                                                    {new Date(p.startTime).toLocaleDateString("vi-VN")} — {new Date(p.endTime).toLocaleDateString("vi-VN")}
                                                </td>
                                                <td>
                                                    <span className={`badge-status ${p.isActive ? "badge-active" : "badge-warning"}`}>
                                                        {p.isActive ? "Đang bật" : "Tắt"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 8 }}>
                                                        <button className="btn btn-light btn-sm" onClick={() => toggleActive(p)} title={p.isActive ? "Tắt" : "Bật"}>
                                                            {p.isActive ? "⏸" : "▶"}
                                                        </button>
                                                        <button className="btn btn-sm" style={{ background: "#fef2f2", color: "#dc2626" }}
                                                            onClick={() => handleDelete(p._id)} title="Xóa">
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
