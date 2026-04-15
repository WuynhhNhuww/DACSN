import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaArrowLeft, FaImage } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const CATEGORIES = ["Thời trang", "Điện tử", "Gia dụng", "Mỹ phẩm", "Thể thao", "Sách", "Khác"];

export default function ProductEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useContext(AuthContext) || {};
    const [form, setForm] = useState(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        axiosClient.get(`/api/products/${id}`)
            .then(res => {
                const p = res.data;
                setForm({
                    name: p.name || "", description: p.description || "",
                    category: p.category || CATEGORIES[0], price: p.price || "",
                    stock: p.stock || 0, status: p.status || "active",
                    images: p.images?.length ? p.images : [""],
                });
            })
            .catch(() => setError("Không tìm thấy sản phẩm."))
            .finally(() => setLoading(false));
    }, [id, user]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const handleImageUpload = (i, event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Vui lòng chọn ảnh có kích thước dưới 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const imgs = [...form.images];
            imgs[i] = reader.result;
            set("images", imgs);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.name || !form.price) return setError("Vui lòng điền đầy đủ thông tin.");
        setSaving(true);
        try {
            await axiosClient.put(`/api/products/${id}`, {
                name: form.name, description: form.description,
                category: form.category, price: Number(form.price),
                stock: Number(form.stock), status: form.status,
                images: form.images.filter(Boolean),
            });
            navigate("/seller/products");
        } catch (err) {
            setError(err?.response?.data?.message || "Cập nhật thất bại.");
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", fontSize: "0.95rem", background: "rgba(0,0,0,0.01)", transition: "0.2s" };
    const labelStyle = { display: "block", marginBottom: 8, fontWeight: 600, color: "var(--as-text)" };

    if (loading) return <div style={{ padding: 40, textAlign: "center", fontSize: "1.1rem" }}>Đang tải dữ liệu sản phẩm...</div>;

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <button className="as-btn as-btn-outline" style={{ padding: "8px 12px", borderRadius: 8 }} onClick={() => navigate("/seller/products", { replace: true })}>
                    <FaArrowLeft />
                </button>
                <h1 className="as-page-title" style={{ margin: 0 }}>Cập nhật Sản phẩm</h1>
            </div>

            {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--as-danger)", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontWeight: 500 }}>{error}</div>}

            {form && (
                <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                        <div className="as-card" style={{ padding: 32 }}>
                            <h3 style={{ margin: "0 0 24px 0", fontSize: "1.2rem", borderBottom: "1px solid var(--as-border)", paddingBottom: 16 }}>Thông tin cơ bản</h3>
                            <div style={{ marginBottom: 20 }}>
                                <label style={labelStyle}>Tên sản phẩm <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={labelStyle}>Mô tả chi tiết <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <textarea style={{ ...inputStyle, resize: "vertical" }} rows={6} value={form.description} onChange={e => set("description", e.target.value)}></textarea>
                            </div>
                            <div>
                                <label style={labelStyle}>Danh mục ngành hàng</label>
                                <select style={{ ...inputStyle, cursor: "pointer", background: "white" }} value={form.category} onChange={e => set("category", e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="as-card" style={{ padding: 32 }}>
                            <h3 style={{ margin: "0 0 24px 0", fontSize: "1.2rem", borderBottom: "1px solid var(--as-border)", paddingBottom: 16 }}>Hình ảnh sản phẩm</h3>
                            <div style={{ marginBottom: 16, color: "var(--as-text-muted)", fontSize: "0.9rem" }}>Upload hình ảnh từ máy (Tối đa 4 ảnh, tối đa 2MB/ảnh). Ảnh đầu tiên sẽ là ảnh bìa. Nếu không chọn ảnh mới, ảnh cũ vẫn được giữ nguyên.</div>
                            <div style={{ display: "grid", gap: 16 }}>
                                {form.images.map((img, i) => (
                                    <div key={i} style={{ display: "flex", gap: 16 }}>
                                        <div style={{ width: 60, height: 60, borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px solid var(--as-border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : <FaImage style={{ color: "var(--as-text-muted)", fontSize: "1.5rem", opacity: 0.5 }} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>Ảnh {i + 1} {i === 0 && "(Ảnh bìa)"}</label>
                                            <input type="file" accept="image/*" style={{ ...inputStyle, padding: "8px 12px", background: "white", cursor: "pointer" }} onChange={e => handleImageUpload(i, e)} />
                                            {img && <div style={{ fontSize: "0.75rem", marginTop: 6, color: "var(--as-success-dark)", fontWeight: 500 }}>✓ Đã có ảnh đính kèm</div>}
                                        </div>
                                    </div>
                                ))}
                                {form.images.length < 4 && (
                                    <button type="button" className="as-btn as-btn-outline" style={{ padding: "8px", borderStyle: "dashed" }} onClick={() => set("images", [...form.images, ""])}>+ Thêm ô nhập ảnh</button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "sticky", top: 100 }}>
                        <div className="as-card" style={{ padding: 24 }}>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem" }}>Bán hàng & Kho</h3>
                            <div style={{ marginBottom: 20 }}>
                                <label style={labelStyle}>Giá bán (₫) <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--as-text-muted)", fontWeight: 600 }}>₫</span>
                                    <input style={{ ...inputStyle, paddingLeft: 36, fontWeight: 600, color: "var(--as-primary)" }} type="number" min={0} value={form.price} onChange={e => set("price", e.target.value)} />
                                </div>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={labelStyle}>Tồn kho</label>
                                <input style={inputStyle} type="number" min={0} value={form.stock} onChange={e => set("stock", e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Trạng thái hiển thị</label>
                                <select style={{ ...inputStyle, cursor: "pointer", background: "white" }} value={form.status} onChange={e => set("status", e.target.value)}>
                                    <option value="active">Đang bán (Hiển thị ngay)</option>
                                    <option value="hidden">Ẩn (Không hiển thị)</option>
                                    <option value="draft">Bản nháp</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                            <button type="submit" className="as-btn as-btn-primary" style={{ padding: 14, fontSize: "1.05rem", width: "100%" }} disabled={saving}>
                                <FaSave style={{ marginRight: 8 }} /> {saving ? "Đang xử lý..." : "Lưu Thay Đổi"}
                            </button>
                            <button type="button" className="as-btn as-btn-outline" style={{ padding: 14, width: "100%" }} onClick={() => navigate("/seller/products", { replace: true })}>Hủy bỏ</button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
