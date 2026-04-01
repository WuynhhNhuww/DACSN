import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaBullhorn, FaPlus } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function SellerAds() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", imageUrl: "", targetType: "shop", position: "home_slider", requestedDays: 7 });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        loadBanners();
    }, [user, navigate]);

    const loadBanners = async () => {
        try {
            const res = await axiosClient.get("/api/banners/seller");
            setBanners(res.data || []);
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
            await axiosClient.post("/api/banners", {
                ...form,
                targetUrl: `/shop/${user.sellerInfo?.shopName}` // Auto-link to shop for MVP
            });
            alert("Đã gửi yêu cầu quảng cáo! Vui lòng chờ Admin duyệt báo giá.");
            setShowForm(false);
            setForm({ title: "", description: "", imageUrl: "", targetType: "shop", position: "home_slider", requestedDays: 7 });
            loadBanners();
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi gửi yêu cầu");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending": return <span className="as-badge as-badge-warning">Chờ Admin duyệt</span>;
            case "rejected": return <span className="as-badge as-badge-danger">Từ chối</span>;
            case "awaiting_payment": return <span className="as-badge as-badge-info">Chờ CK thanh toán</span>;
            case "active": return <span className="as-badge as-badge-success">Đang trực tuyến</span>;
            case "ended": return <span className="as-badge as-badge-neutral">Đã kết thúc / Gỡ</span>;
            default: return <span className="as-badge">{status}</span>;
        }
    };

    const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--as-border)", outline: "none", fontSize: "0.95rem", background: "white" };
    const labelStyle = { display: "block", marginBottom: 8, fontWeight: 600, color: "var(--as-text)", fontSize: "0.9rem" };

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ margin: 0 }}>Quảng cáo Shopee (Banner)</h1>
                <button className="as-btn as-btn-primary" onClick={() => setShowForm(v => !v)}>
                    <FaPlus style={{ marginRight: 8 }} /> Đăng ký Quảng cáo
                </button>
            </div>

            {showForm && (
                <div className="as-card" style={{ padding: 32, marginBottom: 24, border: "1px solid rgba(79, 70, 229, 0.2)", background: "linear-gradient(to bottom right, #ffffff, #fef2f2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem", color: "var(--as-danger)", display: "flex", alignItems: "center", gap: 8 }}>
                            <FaBullhorn /> Đăng ký Chiến dịch Quảng Cáo
                        </h3>
                        <button style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--as-text-muted)" }} onClick={() => setShowForm(false)}>&times;</button>
                    </div>

                    <form onSubmit={handleCreate}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div>
                                <label style={labelStyle}>Tiêu đề Banner <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <input required style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Sale Sập Sàn 50%" />
                            </div>
                            <div>
                                <label style={labelStyle}>Vị trí hiển thị <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <select style={inputStyle} value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                                    <option value="home_slider">Trang Chủ (Slider Top Vàng)</option>
                                    <option value="category_top">Đầu Trang Danh Mục</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                            <div>
                                <label style={labelStyle}>Số ngày chạy mong muốn <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <select style={inputStyle} value={form.requestedDays} onChange={e => setForm({ ...form, requestedDays: Number(e.target.value) })}>
                                    <option value={7}>1 Tuần (7 ngày)</option>
                                    <option value={15}>Nửa Tháng (15 ngày)</option>
                                    <option value={30}>1 Tháng (30 ngày)</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>URL Ảnh Banner <span style={{ color: "var(--as-danger)" }}>*</span></label>
                                <input required style={inputStyle} placeholder="https://..." value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={labelStyle}>Mô tả chi tiết (Tuỳ chọn)</label>
                            <textarea style={{ ...inputStyle, resize: "vertical" }} rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ghi chú thêm cho Admin về thời gian, đối tượng mong muốn..." />
                        </div>

                        <div style={{ padding: "16px", background: "rgba(245, 158, 11, 0.1)", color: "#b45309", borderRadius: 8, fontSize: "0.95rem", marginBottom: 24, border: "1px dashed rgba(245, 158, 11, 0.5)" }}>
                            <strong>📌 Lưu ý quy trình:</strong>
                            <ol style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
                                <li style={{ marginBottom: 4 }}>Gửi yêu cầu đăng ký quảng cáo.</li>
                                <li style={{ marginBottom: 4 }}>Admin sẽ duyệt nội dung ảnh (tránh vi phạm, phản cảm) và báo mức phí. <span style={{ fontStyle: "italic", fontSize: "0.85rem" }}>(Tối thiểu 100,000đ/ngày)</span></li>
                                <li>Bạn chấp nhận mức phí và thanh toán chuyển khoản, tiến trình sẽ được kích hoạt!</li>
                            </ol>
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button type="submit" className="as-btn as-btn-primary" style={{ padding: "14px", flex: 1, fontSize: "1.05rem" }} disabled={submitting}>
                                {submitting ? "Đang gửi đi..." : "Gửi yêu cầu & Chờ báo giá"}
                            </button>
                            <button type="button" className="as-btn as-btn-outline" style={{ padding: "14px 24px" }} onClick={() => setShowForm(false)}>Hủy</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="as-table-wrapper">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>
                ) : banners.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", background: "white", borderRadius: 16 }}>
                        <div style={{ fontSize: "3rem", marginBottom: 16 }}><FaBullhorn color="var(--as-border)" /></div>
                        <h3 style={{ margin: "0 0 16px 0", color: "var(--as-text)" }}>Chưa có chiến dịch quảng cáo nào</h3>
                    </div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Nội dung Banner</th>
                                <th>Chi tiết hiển thị</th>
                                <th>Chi phí Dịch vụ</th>
                                <th>Tiến độ / Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map(b => (
                                <tr key={b._id}>
                                    <td>
                                        <div style={{ display: "flex", gap: 16 }}>
                                            <div style={{ width: 100, height: 50, borderRadius: 8, border: "1px solid var(--as-border)", overflow: "hidden", background: "rgba(0,0,0,0.03)" }}>
                                                {b.imageUrl ? <img src={b.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <span style={{ display: "block", textAlign: "center", paddingTop: 16, fontSize: "0.8rem", color: "var(--as-text-muted)" }}>No img</span>}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--as-text)", marginBottom: 4, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                                                <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", background: "rgba(0,0,0,0.04)", padding: "2px 8px", borderRadius: 4, display: "inline-block", fontWeight: 600 }}>{b.position}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ color: "var(--as-text)", fontSize: "0.95rem" }}>Đã đặt: <span style={{ fontWeight: 700, color: "var(--as-primary)" }}>{b.requestedDays} ngày</span></div>
                                        {b.status === "active" && b.endDate && (
                                            <div style={{ fontSize: "0.85rem", color: "var(--as-success)", marginTop: 6, fontWeight: 600 }}>
                                                K.Thúc: {new Date(b.endDate).toLocaleDateString("vi-VN")}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {b.fee ? (
                                            <div style={{ fontWeight: 700, color: "var(--as-danger)", fontSize: "1.1rem" }}>{fmt(b.fee)}</div>
                                        ) : (
                                            <span style={{ color: "var(--as-text-muted)", fontStyle: "italic", fontSize: "0.9rem", fontWeight: 500 }}>Đang chờ định giá...</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ marginBottom: 8 }}>{getStatusBadge(b.status)}</div>

                                        {b.status === "rejected" && b.rejectedReason && (
                                            <div style={{ fontSize: "0.85rem", color: "var(--as-danger)", background: "rgba(239, 68, 68, 0.05)", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(239, 68, 68, 0.2)", maxWidth: 250 }}>
                                                <strong>Lý do:</strong> {b.rejectedReason}
                                            </div>
                                        )}

                                        {b.status === "awaiting_payment" && (
                                            <div style={{ marginTop: 8, padding: 12, background: "rgba(59, 130, 246, 0.05)", border: "1px dashed rgba(59, 130, 246, 0.4)", borderRadius: 8, fontSize: "0.85rem", maxWidth: 280 }}>
                                                Vui lòng chuyển khoản đúng <strong style={{ color: "var(--as-danger)", fontSize: "0.95rem" }}>{fmt(b.fee)}</strong> vào:<br />
                                                <div style={{ padding: "6px 0", margin: "6px 0", borderTop: "1px solid rgba(0,0,0,0.05)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                                                    <strong>STK:</strong> <span style={{ fontFamily: "monospace", fontSize: "1rem", color: "var(--as-primary)" }}>99998888</span> (VPBank)<br />
                                                    <strong>Nội dung:</strong> {b._id.toUpperCase().slice(-6)}
                                                </div>
                                                <div style={{ color: "var(--as-text-muted)", fontSize: "0.8rem", fontStyle: "italic" }}>Gửi Ủy nhiệm chi cho CSKH hoặc chờ hệ thống tự đối soát trong 30p!</div>
                                            </div>
                                        )}
                                        {b.status === "active" && (
                                            <div style={{ fontSize: "0.8rem", color: "var(--as-text-muted)", marginTop: 6 }}>
                                                Q.Cáo của bạn đang được ưu tiên hiển thị trên sàn.
                                            </div>
                                        )}
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
