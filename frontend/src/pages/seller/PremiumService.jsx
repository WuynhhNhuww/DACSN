import { useState, useEffect, useContext } from "react";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import { FaCrown, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function PremiumService() {
    const { user, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setIsRegistered(user?.sellerInfo?.isPremiumServiceRegistered || false);
        setLoading(false);
    }, [user]);

    const handleToggleService = async (action) => {
        if (!window.confirm(`Bạn có chắc chắn muốn ${action === "register" ? "đăng ký" : "hủy"} Gói Dịch Vụ Freeship/Voucher Xtra?`)) return;
        
        setSubmitting(true);
        setMessage("");
        try {
            const res = await axiosClient.post("/api/users/premium-service", { action });
            setIsRegistered(res.data.isPremiumServiceRegistered);
            setMessage(res.data.message);
            
            // Cập nhật AuthContext
            const updatedUser = { ...user };
            if (!updatedUser.sellerInfo) updatedUser.sellerInfo = {};
            updatedUser.sellerInfo.isPremiumServiceRegistered = res.data.isPremiumServiceRegistered;
            setUser(updatedUser);
        } catch (error) {
            setMessage(error.response?.data?.message || "Đã xảy ra lỗi.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Đang tải...</div>;

    return (
        <div className="as-container">
            <h1 className="as-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FaCrown style={{ color: "#f59e0b" }} /> Dịch Vụ Premium (Freeship/Voucher Xtra)
            </h1>

            <div className="as-card" style={{ padding: 32, maxWidth: 800 }}>
                {message && <div style={{ marginBottom: 20, padding: 12, borderRadius: 8, background: "#d1fae5", color: "#065f46", fontSize: 14, fontWeight: 600 }}>{message}</div>}
                
                <div style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Đặc quyền Gói Dịch Vụ</h3>
                    <p style={{ color: "var(--as-text-light)", lineHeight: 1.6, marginBottom: 16 }}>
                        Khi tham gia Gói Dịch Vụ, Shop của bạn sẽ nhận được các ưu quyền sau:
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                        <li style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <FaCheckCircle style={{ color: "#10b981", marginTop: 4 }} />
                            <div>
                                <strong style={{ display: "block" }}>Được áp dụng các Mã Voucher Toàn Sàn (Freeship / Voucher Giảm Giá)</strong>
                                <span style={{ color: "var(--as-text-light)", fontSize: 13 }}>Người mua sẽ có thể sử dụng hàng ngàn mã giảm giá do hệ thống phát hành cho các sản phẩm của shop bạn.</span>
                            </div>
                        </li>
                        <li style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <FaCheckCircle style={{ color: "#10b981", marginTop: 4 }} />
                            <div>
                                <strong style={{ display: "block" }}>Tăng tỷ lệ chuyển đổi đơn hàng</strong>
                                <span style={{ color: "var(--as-text-light)", fontSize: 13 }}>Hiển thị nhãn Xtra nổi bật, thu hút người mua click và hoàn tất đơn hàng dễ dàng hơn.</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <div style={{ padding: 20, background: "#fffbeb", borderRadius: 12, marginBottom: 32, border: "1px solid #fde68a" }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: "#b45309", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <FaExclamationCircle /> Biểu phí Dịch Vụ
                    </h4>
                    <p style={{ color: "#92400e", fontSize: 14 }}>
                        Bằng việc đăng ký, bạn đồng ý tham gia Gói Dịch Vụ với mức phí là <strong>2%</strong> trên tổng giá trị đơn hàng (Chưa bao gồm các khoản phí cơ bản khác).<br/>
                        Phí này sẽ được tự động cấn trừ vào doanh thu mỗi khi có đơn hàng được hoàn tất.
                    </p>
                </div>

                <div style={{ padding: 24, border: "1.5px solid var(--as-line)", borderRadius: 16, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Trạng thái tham gia</div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 20, background: isRegistered ? "#d1fae5" : "#f1f5f9", color: isRegistered ? "#065f46" : "var(--as-text-light)", fontSize: 13, fontWeight: 600 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: isRegistered ? "#10b981" : "#94a3b8" }} />
                            {isRegistered ? "Đang tham gia gói Dịch Vụ" : "Chưa đăng ký dịch vụ"}
                        </div>
                    </div>
                    <div>
                        {isRegistered ? (
                            <button 
                                className="as-btn as-btn-danger" 
                                disabled={submitting}
                                onClick={() => handleToggleService("cancel")}
                            >
                                {submitting ? "Đang xử lý..." : "Hủy đăng ký"}
                            </button>
                        ) : (
                            <button 
                                className="as-btn as-btn-primary" 
                                disabled={submitting}
                                onClick={() => handleToggleService("register")}
                                style={{ display: "flex", alignItems: "center", gap: 8 }}
                            >
                                <FaCrown /> {submitting ? "Đang xử lý..." : "Đăng ký ngay (Phí 2%)"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
