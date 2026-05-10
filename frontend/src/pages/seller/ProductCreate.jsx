import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaArrowLeft, FaImage, FaMagic } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const CATEGORIES = ["Thời trang", "Điện tử", "Gia dụng", "Mỹ phẩm", "Thể thao", "Sách", "Khác"];

export default function ProductCreate() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};
    const [form, setForm] = useState({
        name: "", description: "", category: CATEGORIES[0],
        price: "", stock: "", status: "pending_review",
        images: [""],
        variants: [], // { name, price, stock }
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.name || !form.price || !form.description) return setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
        setSaving(true);
        try {
            const images = form.images.filter(Boolean);
            await axiosClient.post("/api/products", {
                name: form.name, description: form.description,
                category: form.category, price: Number(form.price),
                stock: Number(form.stock || 0), status: "pending_review",
                images,
                variants: form.variants.map(v => ({ ...v, price: Number(v.price), stock: Number(v.stock) })),
            });
            alert("Đã gửi yêu cầu tạo sản phẩm! Vui lòng chờ Admin duyệt để hiển thị trên sàn.");
            navigate("/seller/products");
        } catch (err) {
            setError(err?.response?.data?.message || "Tạo sản phẩm thất bại.");
        } finally {
            setSaving(false);
        }
    };

    const handleAIGenerate = async () => {
        if (!form.name || form.name.length < 5) return alert("Vui lòng nhập tên sản phẩm rõ ràng hơn (ít nhất 5 ký tự) để AI viết mô tả chính xác.");
        setGenerating(true);
        try {
            const res = await axiosClient.post("/api/ai/generate-description", {
                productName: form.name,
                category: form.category
            });
            set("description", res.data.description);
        } catch (err) {
            alert("Lỗi khi kết nối với AI Assistant.");
        } finally {
            setGenerating(false);
        }
    };

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

    const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", fontSize: "0.95rem", background: "rgba(0,0,0,0.01)", transition: "0.2s" };
    const labelStyle = { display: "block", marginBottom: 8, fontWeight: 600, color: "var(--as-text)" };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <button className="as-btn as-btn-outline" style={{ padding: "8px 12px", borderRadius: 8 }} onClick={() => navigate("/seller/products", { replace: true })}>
                    <FaArrowLeft />
                </button>
                <h1 className="as-page-title" style={{ margin: 0 }}>Thêm sản phẩm mới</h1>
            </div>

            {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--as-danger)", padding: "12px 16px", borderRadius: 8, marginBottom: 24, fontWeight: 500 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div className="as-card" style={{ padding: 32 }}>
                        <h3 style={{ margin: "0 0 24px 0", fontSize: "1.2rem", borderBottom: "1px solid var(--as-border)", paddingBottom: 16 }}>Thông tin cơ bản</h3>
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Tên sản phẩm <span style={{ color: "var(--as-danger)" }}>*</span></label>
                            <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Tên sản phẩm đầy đủ..." />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>Mô tả chi tiết <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <button type="button" onClick={handleAIGenerate} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(79, 70, 229, 0.1)", color: "var(--as-primary)", border: "1px solid var(--as-primary)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
                                    <FaMagic /> {generating ? "Đang viết..." : "AI tự viết mô tả"}
                                </button>
                            </div>
                            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={8} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Đặc điểm nổi bật, thông số kỹ thuật, hướng dẫn sử dụng..."></textarea>
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
                        <div style={{ marginBottom: 16, color: "var(--as-text-muted)", fontSize: "0.9rem" }}>Upload hình ảnh từ máy (Tối đa 4 ảnh, tối đa 2MB/ảnh). Ảnh đầu tiên sẽ là ảnh bìa.</div>
                        <div style={{ display: "grid", gap: 16 }}>
                            {form.images.map((img, i) => (
                                <div key={i} style={{ display: "flex", gap: 16 }}>
                                    <div style={{ width: 60, height: 60, borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px solid var(--as-border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : <FaImage style={{ color: "var(--as-text-muted)", fontSize: "1.5rem", opacity: 0.5 }} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600 }}>Ảnh {i + 1} {i === 0 && "(Ảnh bìa)"}</label>
                                        <input type="file" accept="image/*" style={{ ...inputStyle, padding: "8px 12px", background: "white", cursor: "pointer" }} onChange={e => handleImageUpload(i, e)} />
                                        {img && <div style={{ fontSize: "0.75rem", marginTop: 6, color: "var(--as-success-dark)", fontWeight: 500 }}>✓ Đã đính kèm ảnh</div>}
                                    </div>
                                </div>
                            ))}
                            {form.images.length < 4 && (
                                <button type="button" className="as-btn as-btn-outline" style={{ padding: "8px", borderStyle: "dashed" }} onClick={() => set("images", [...form.images, ""])}>+ Thêm ô nhập ảnh</button>
                            )}
                        </div>
                    </div>

                    <div className="as-card" style={{ padding: 32 }}>
                        <h3 style={{ margin: "0 0 24px 0", fontSize: "1.2rem", borderBottom: "1px solid var(--as-border)", paddingBottom: 16 }}>Phân loại hàng (Variants)</h3>
                        <div style={{ marginBottom: 16, color: "var(--as-text-muted)", fontSize: "0.9rem" }}>Thêm các lựa chọn như Màu sắc, Kích cỡ... Nếu có phân loại, giá và kho sẽ theo phân loại.</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {form.variants.map((v, i) => (
                                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 40px", gap: 12, alignItems: "center", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid var(--as-border)" }}>
                                    <input style={{ ...inputStyle, background: "#fff", padding: "8px 12px" }} placeholder="Tên loại (Vd: Màu Đỏ, Size M)" value={v.name} onChange={e => {
                                        const next = [...form.variants];
                                        next[i].name = e.target.value;
                                        set("variants", next);
                                    }} />
                                    <input type="number" style={{ ...inputStyle, background: "#fff", padding: "8px 12px" }} placeholder="Giá" value={v.price} onChange={e => {
                                        const next = [...form.variants];
                                        next[i].price = e.target.value;
                                        set("variants", next);
                                    }} />
                                    <input type="number" style={{ ...inputStyle, background: "#fff", padding: "8px 12px" }} placeholder="Kho" value={v.stock} onChange={e => {
                                        const next = [...form.variants];
                                        next[i].stock = e.target.value;
                                        set("variants", next);
                                    }} />
                                    <button type="button" style={{ border: "none", background: "none", color: "var(--as-danger)", cursor: "pointer" }} onClick={() => {
                                        set("variants", form.variants.filter((_, idx) => idx !== i));
                                    }}>✕</button>
                                </div>
                            ))}
                            <button type="button" className="as-btn as-btn-outline" style={{ padding: "10px", borderStyle: "dashed" }} onClick={() => set("variants", [...form.variants, { name: "", price: form.price, stock: 10 }])}>+ Thêm phân loại hàng</button>
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
                                <input style={{ ...inputStyle, paddingLeft: 36, fontWeight: 600, color: "var(--as-primary)" }} type="number" min={0} value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Tồn kho</label>
                            <input style={inputStyle} type="number" min={0} value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="0" />
                        </div>
                    </div>

                    <div className="as-card" style={{ padding: 24, background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                        <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", color: "var(--as-warning)" }}>Quy trình duyệt</h3>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--as-text-muted)", lineHeight: 1.5 }}>
                            Sản phẩm mới tải lên sẽ có trạng thái <strong>Chờ Duyệt</strong>. Đội ngũ kiểm duyệt của WPN Store sẽ xem xét trong vòng 24h trước khi cho phép hiển thị với Khách hàng.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
                        <button type="submit" className="as-btn as-btn-primary" style={{ padding: 14, fontSize: "1.05rem", width: "100%" }} disabled={saving}>
                            <FaSave style={{ marginRight: 8 }} /> {saving ? "Đang xử lý..." : "Lưu & Gửi đi"}
                        </button>
                        <button type="button" className="as-btn as-btn-outline" style={{ padding: 14, width: "100%" }} onClick={() => navigate("/seller/products", { replace: true })}>Hủy bỏ</button>
                    </div>
                </div>
            </form>
        </div>
    );
}
