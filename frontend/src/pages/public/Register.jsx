import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!form.name || !form.email || !form.password) return setError("Vui lòng nhập đầy đủ thông tin.");
        if (form.password.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự.");
        if (form.password !== form.confirm) return setError("Mật khẩu xác nhận không khớp.");
        setLoading(true);
        try {
            await axiosClient.post("/api/users/register", { name: form.name, email: form.email, password: form.password });
            setSuccess("Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác thực tài khoản trước khi đăng nhập.");
            setForm({ name: "", email: "", password: "", confirm: "" });
        } catch (err) {
            setError(err?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="authPage">
            <div className="authCard">
                <div className="authLogo">
                    <div className="name">WNP</div>
                    <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Mini — Đăng ký miễn phí</div>
                </div>

                <h2 className="authTitle">Tạo tài khoản</h2>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success" style={{ background: "#e1ffeb", color: "#28a745", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="formGroup">
                        <label className="formLabel">Họ và tên</label>
                        <input className="formControl" name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Văn A" autoFocus />
                    </div>

                    <div className="formGroup">
                        <label className="formLabel">Email</label>
                        <input className="formControl" type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
                    </div>

                    <div className="formGroup">
                        <label className="formLabel">Mật khẩu</label>
                        <div style={{ position: "relative" }}>
                            <input
                                className="formControl"
                                type={showPass ? "text" : "password"}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Tối thiểu 6 ký tự"
                                style={{ paddingRight: 44 }}
                            />
                            <button type="button" onClick={() => setShowPass(v => !v)}
                                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: 0, border: 0, color: "#aaa", cursor: "pointer", fontSize: 16 }}>
                                {showPass ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="formGroup">
                        <label className="formLabel">Xác nhận mật khẩu</label>
                        <input className="formControl" type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Nhập lại mật khẩu" />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? "Đang đăng ký..." : "Đăng ký"}
                    </button>
                </form>

                <div className="authSwitch" style={{ marginTop: 20 }}>
                    Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
                </div>
            </div>
        </div>
    );
}
