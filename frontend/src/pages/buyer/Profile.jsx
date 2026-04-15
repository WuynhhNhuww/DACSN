import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUser, FaEnvelope, FaEdit, FaSave, FaStore, FaSignOutAlt,
    FaShoppingBag, FaCartPlus, FaChevronRight, FaPhone,
    FaVenusMars, FaBirthdayCake, FaHeart, FaWallet, FaTimes,
    FaBoxOpen, FaMapMarkerAlt, FaCheckCircle,
} from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import ShopeeFooter from "../../components/ShopeeFooter";

/* ─── DANH MỤC NGÀNH HÀNG ─── */
const CATEGORIES = [
    "Điện thoại & Phụ kiện", "Laptop & Máy tính", "Nước hoa & Làm đẹp",
    "Thực phẩm & Đồ uống", "Thời trang Nam", "Thời trang Nữ",
    "Giày dép", "Đồng hồ & Trang sức", "Nội thất & Trang trí nhà",
    "Ô tô & Xe máy", "Thể thao & Du lịch", "Đồ chơi & Trẻ em",
    "Sách & Văn phòng phẩm", "Thiết bị điện gia dụng", "Khác",
];

/* ─── SELLER REGISTRATION MODAL ─── */
function SellerRegModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({
        shopName: "",
        shopDescription: "",
        category: "",
        phone: "",
        address: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.shopName.trim()) { setError("Vui lòng nhập tên cửa hàng."); return; }
        if (!form.category) { setError("Vui lòng chọn ngành hàng kinh doanh."); return; }
        if (!form.phone.trim()) { setError("Vui lòng nhập số điện thoại liên hệ."); return; }
        setLoading(true);
        try {
            await axiosClient.put("/api/users/become-seller", {
                shopName: form.shopName,
                shopDescription: `[${form.category}] ${form.shopDescription}`,
                phone: form.phone,
                address: form.address,
            });
            onSuccess();
        } catch (err) {
            setError(err?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
                {/* Header */}
                <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 20, color: "var(--text)", display: "flex", alignItems: "center", gap: 10 }}>
                            <FaStore style={{ color: "var(--primary)" }} /> Đăng ký Người Bán
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-light)", marginTop: 4 }}>
                            Điền thông tin để bắt đầu bán hàng trên WPN Store
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-light)", padding: 8, borderRadius: 8, fontSize: 18 }}>
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} style={{ padding: 28 }}>
                    {error && <div className="alert alert-error" style={{ borderRadius: 12, marginBottom: 20 }}>{error}</div>}

                    {/* Tên cửa hàng */}
                    <div className="formGroup" style={{ marginBottom: 16 }}>
                        <label className="formLabel" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <FaStore size={11} /> Tên cửa hàng <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            className="formControl"
                            placeholder="Ví dụ: Shop Điện Thoại Minh Tuấn"
                            value={form.shopName}
                            onChange={e => setForm({ ...form, shopName: e.target.value })}
                            style={{ borderRadius: 12 }}
                            autoFocus
                        />
                    </div>

                    {/* Ngành hàng */}
                    <div className="formGroup" style={{ marginBottom: 16 }}>
                        <label className="formLabel" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <FaBoxOpen size={11} /> Ngành hàng kinh doanh <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <select
                            className="formControl"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            style={{ borderRadius: 12 }}
                        >
                            <option value="">-- Chọn ngành hàng --</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Mô tả cửa hàng */}
                    <div className="formGroup" style={{ marginBottom: 16 }}>
                        <label className="formLabel" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, display: "block" }}>
                            Mô tả cửa hàng (không bắt buộc)
                        </label>
                        <textarea
                            className="formControl"
                            placeholder="Giới thiệu ngắn về cửa hàng của bạn, sản phẩm bạn bán..."
                            value={form.shopDescription}
                            onChange={e => setForm({ ...form, shopDescription: e.target.value })}
                            rows={3}
                            style={{ borderRadius: 12, resize: "vertical" }}
                        />
                    </div>

                    {/* Số điện thoại */}
                    <div className="formGroup" style={{ marginBottom: 16 }}>
                        <label className="formLabel" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <FaPhone size={11} /> Số điện thoại liên hệ <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            className="formControl"
                            type="tel"
                            placeholder="0901 234 567"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            style={{ borderRadius: 12 }}
                        />
                    </div>

                    {/* Địa chỉ kho hàng */}
                    <div className="formGroup" style={{ marginBottom: 24 }}>
                        <label className="formLabel" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <FaMapMarkerAlt size={11} /> Địa chỉ kho hàng (không bắt buộc)
                        </label>
                        <input
                            className="formControl"
                            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            style={{ borderRadius: 12 }}
                        />
                    </div>

                    {/* Note */}
                    <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "var(--text-light)", lineHeight: 1.6 }}>
                        ℹ️ Đơn đăng ký sẽ được Admin xem xét trong vòng <strong>24–48 giờ</strong>. Bạn sẽ nhận thông báo khi được duyệt.
                    </div>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: 12 }}>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: 15 }}>
                            {loading ? "Đang gửi..." : "Gửi đơn đăng ký"}
                        </button>
                        <button type="button" className="btn" onClick={onClose} style={{ padding: "14px 20px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--line)", fontWeight: 700 }}>
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── MAIN PROFILE PAGE ─── */
export default function Profile() {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext) || {};
    const [form, setForm] = useState({ name: "", email: "", phone: "", gender: "", dob: "" });
    const [editing, setEditing] = useState(false);
    const [showSellerModal, setShowSellerModal] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        setForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            gender: user.gender || "",
            dob: user.dob ? user.dob.slice(0, 10) : "",
        });
    }, [user, navigate]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosClient.put("/api/users/profile", {
                name: form.name,
                phone: form.phone,
                gender: form.gender,
                dob: form.dob || null,
            });
            setMsg({ text: "✓ Cập nhật hồ sơ thành công!", type: "success" });
            setEditing(false);
        } catch {
            setMsg({ text: "Cập nhật thất bại. Vui lòng thử lại.", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setMsg({ text: "", type: "" }), 3000);
        }
    };

    if (!user) return null;

    const roleLabel = { buyer: "Người Mua", seller: "Người Bán", admin: "Quản trị viên" };
    const genderLabel = { male: "Nam", female: "Nữ", other: "Khác", "": "Chưa cập nhật" };

    const DisplayField = ({ icon, label, value, readOnly }) => (
        <div className="formGroup" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lighter)", display: "flex", alignItems: "center", gap: 5, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {icon} {label}
            </label>
            <div style={{ padding: "11px 16px", background: readOnly ? "#f8fafc" : "var(--bg)", borderRadius: 12, border: "1.5px solid var(--line)", fontWeight: readOnly ? 400 : 600, color: readOnly ? "var(--text-lighter)" : (value ? "var(--text)" : "var(--text-lighter)"), fontSize: 14 }}>
                {value || (readOnly ? "Không thể thay đổi" : "Chưa cập nhật")}
            </div>
        </div>
    );

    const sellerStatus = user.sellerInfo?.sellerStatus;
    const canRegisterSeller = user.role === "buyer" && (!sellerStatus || sellerStatus === "inactive" || sellerStatus === "rejected");
    const pendingSeller = user.role === "buyer" && sellerStatus === "pending";

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 80 }}>
            {showSellerModal && (
                <SellerRegModal
                    onClose={() => setShowSellerModal(false)}
                    onSuccess={() => {
                        setShowSellerModal(false);
                        setMsg({ text: "✓ Đã gửi đơn đăng ký. Chờ Admin duyệt!", type: "success" });
                        setTimeout(() => window.location.reload(), 2000);
                    }}
                />
            )}

            <div className="container" style={{ paddingTop: 40, maxWidth: 700 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28 }}>Hồ Sơ Của Tôi</h1>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 20, alignItems: "start" }}>
                    {/* LEFT */}
                    <div>
                        <div className="card" style={{ padding: 28, borderRadius: 24, boxShadow: "var(--shadow-sm)", background: "#fff" }}>
                            {/* Avatar */}
                            <div style={{ display: "flex", alignItems: "center", gap: 18, paddingBottom: 22, borderBottom: "1px solid var(--line)", marginBottom: 22 }}>
                                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", display: "grid", placeItems: "center", fontSize: 28, color: "#fff", fontWeight: 900, flexShrink: 0, boxShadow: "0 6px 18px -3px rgba(79, 70, 229, 0.4)" }}>
                                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 19, color: "var(--text)" }}>{user.name}</div>
                                    <div style={{ fontSize: 12, marginTop: 5, display: "inline-flex", padding: "3px 12px", borderRadius: 20, background: "var(--primary-light)", color: "var(--primary)", fontWeight: 700 }}>
                                        {roleLabel[user.role] || user.role}
                                    </div>
                                </div>
                            </div>

                            {msg.text && (
                                <div className={`alert alert-${msg.type}`} style={{ borderRadius: 12, marginBottom: 20 }}>
                                    {msg.text}
                                </div>
                            )}

                            {/* Fields */}
                            {editing ? (
                                <>
                                    <div className="formGroup" style={{ marginBottom: 16 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lighter)", display: "flex", alignItems: "center", gap: 5, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            <FaUser size={11} /> Họ và tên
                                        </label>
                                        <input className="formControl" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ borderRadius: 12 }} autoFocus />
                                    </div>
                                    <div className="formGroup" style={{ marginBottom: 16 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lighter)", display: "flex", alignItems: "center", gap: 5, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            <FaPhone size={11} /> Số điện thoại
                                        </label>
                                        <input className="formControl" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ borderRadius: 12 }} placeholder="0901 234 567" />
                                    </div>
                                    <div className="formGroup" style={{ marginBottom: 16 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lighter)", display: "flex", alignItems: "center", gap: 5, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            <FaVenusMars size={11} /> Giới tính
                                        </label>
                                        <select className="formControl" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ borderRadius: 12 }}>
                                            <option value="">-- Chọn giới tính --</option>
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                    <div className="formGroup" style={{ marginBottom: 20 }}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lighter)", display: "flex", alignItems: "center", gap: 5, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                            <FaBirthdayCake size={11} /> Ngày sinh
                                        </label>
                                        <input className="formControl" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} style={{ borderRadius: 12 }} max={new Date().toISOString().slice(0, 10)} />
                                    </div>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 12, fontWeight: 700 }}>
                                            <FaSave style={{ marginRight: 8 }} />{saving ? "Đang lưu..." : "Lưu thay đổi"}
                                        </button>
                                        <button className="btn" onClick={() => setEditing(false)} style={{ padding: "12px 18px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--line)", fontWeight: 700 }}>
                                            Hủy
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <DisplayField icon={<FaUser size={11} />} label="Họ và tên" value={form.name} />
                                    <DisplayField icon={<FaEnvelope size={11} />} label="Email" value={form.email} readOnly />
                                    <DisplayField icon={<FaPhone size={11} />} label="Số điện thoại" value={form.phone} />
                                    <DisplayField icon={<FaVenusMars size={11} />} label="Giới tính" value={genderLabel[form.gender]} />
                                    <DisplayField
                                        icon={<FaBirthdayCake size={11} />}
                                        label="Ngày sinh"
                                        value={form.dob ? new Date(form.dob).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}
                                    />
                                    <button className="btn btn-outline" onClick={() => setEditing(true)} style={{ width: "100%", padding: "12px", borderRadius: 12, fontWeight: 700, marginTop: 8 }}>
                                        <FaEdit style={{ marginRight: 8 }} /> Chỉnh sửa hồ sơ
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Become Seller */}
                        {pendingSeller && (
                            <div style={{ marginTop: 14, padding: "14px 18px", background: "rgba(245, 158, 11, 0.08)", color: "#b45309", borderRadius: 16, border: "1px dashed #f59e0b", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
                                <FaCheckCircle style={{ flexShrink: 0 }} />
                                <div>Đơn đăng ký Người Bán đang <strong>Chờ Admin Duyệt</strong>. Chúng tôi sẽ thông báo sớm.</div>
                            </div>
                        )}

                        {canRegisterSeller && (
                            <div style={{ marginTop: 14 }}>
                                <button
                                    className="btn"
                                    onClick={() => setShowSellerModal(true)}
                                    style={{ width: "100%", background: "linear-gradient(135deg, #f0f7ff, #e0e7ff)", border: "2px dashed var(--primary)", color: "var(--primary)", padding: "16px", borderRadius: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 15 }}
                                >
                                    <FaStore /> Đăng ký làm Người Bán
                                </button>
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-lighter)", marginTop: 8 }}>
                                    Mở gian hàng và bắt đầu kinh doanh trên WPN Store
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Quick links */}
                    <div>
                        <div className="card" style={{ padding: 20, borderRadius: 24, boxShadow: "var(--shadow-sm)", background: "#fff", marginBottom: 14 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>Hoạt động</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                {[
                                    { icon: <FaShoppingBag />, label: "Đơn mua của tôi", path: "/buyer/orders" },
                                    { icon: <FaCartPlus />, label: "Giỏ hàng", path: "/buyer/cart" },
                                    { icon: <FaHeart />, label: "Yêu thích", path: "/buyer/wishlist" },
                                    { icon: <FaWallet />, label: "Ví của tôi", path: "/buyer/wallet" },
                                ].map(item => (
                                    <div key={item.path} onClick={() => navigate(item.path)}
                                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 12, cursor: "pointer", transition: "all 0.15s", color: "var(--text)" }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "var(--primary-light)"; e.currentTarget.style.color = "var(--primary)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text)"; }}
                                    >
                                        <span style={{ fontSize: 15, color: "var(--primary)" }}>{item.icon}</span>
                                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{item.label}</span>
                                        <FaChevronRight size={10} style={{ opacity: 0.3 }} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                                <button className="btn" onClick={() => { logout?.(); navigate("/login"); }}
                                    style={{ width: "100%", background: "rgba(239, 68, 68, 0.05)", color: "var(--accent)", border: "none", padding: "11px", borderRadius: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13 }}>
                                    <FaSignOutAlt /> Đăng xuất
                                </button>
                            </div>
                        </div>

                        {/* Member since */}
                        <div className="card" style={{ padding: "14px 18px", borderRadius: 18, boxShadow: "var(--shadow-sm)", background: "#fff" }}>
                            <div style={{ fontSize: 11, color: "var(--text-lighter)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Thành viên từ</div>
                            <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 14 }}>
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" }) : "—"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ShopeeFooter />
        </div>
    );
}
