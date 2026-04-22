import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const { login, googleLogin, user } = useContext(AuthContext) || {};
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token && user) {
            if (user.role === "admin") navigate("/admin/dashboard");
            else if (user.role === "seller") navigate("/seller/dashboard");
            else navigate("/home");
        }
    }, [user, navigate]);

    // Google Login Logic
    useEffect(() => {
        /* global google */
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            google.accounts.id.initialize({
                client_id: "8991687553-rcqo1vr7t3iqvd4a5ts1ut092lhvhsd0.apps.googleusercontent.com",
                callback: handleGoogleCallback,
            });
            google.accounts.id.renderButton(
                document.getElementById("googleBtn"),
                { theme: "outline", size: "large", width: "100%", text: "continue_with" }
            );
        };
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    const handleGoogleCallback = async (response) => {
        setLoading(true);
        try {
            await googleLogin(response.credential);
        } catch (err) {
            setError(err?.response?.data?.message || "Google Login failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.email || !form.password) {
            setError("Vui lòng nhập đầy đủ thông tin.");
            return;
        }
        setLoading(true);
        try {
            await login(form.email, form.password);
        } catch (err) {
            setError(err?.response?.data?.message || "Email hoặc mật khẩu không đúng.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="authPage">
            <div className="authCard">
                <div className="authLogo">
                    <div className="name">WNP</div>
                    <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>Mini — Mua sắm thật dễ</div>
                </div>

                <h2 className="authTitle">Đăng nhập</h2>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="formGroup">
                        <label className="formLabel">Email</label>
                        <input
                            className="formControl"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            autoFocus
                        />
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
                                placeholder="Nhập mật khẩu"
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(v => !v)}
                                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: 0, border: 0, color: "#aaa", cursor: "pointer", fontSize: 16 }}
                            >
                                {showPass ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                </form>

                <div className="authDivider">Hoặc</div>

                <div id="googleBtn" style={{ marginBottom: 20 }}></div>

                <div className="authSwitch">
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </div>
                <div className="authSwitch" style={{ marginTop: 8 }}>
                    <Link to="/home">← Quay về trang chủ</Link>
                </div>
            </div>
        </div>
    );
}
