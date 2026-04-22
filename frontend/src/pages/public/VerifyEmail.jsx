import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { verifyEmail } from "../../api/authApi";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading"); // loading, success, error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
            setStatus("error");
            setMessage("Link xác nhận không hợp lệ.");
            return;
        }

        verifyEmail(token, email)
            .then(res => {
                setStatus("success");
                setMessage(res.data.message);
            })
            .catch(err => {
                setStatus("error");
                setMessage(err.response?.data?.message || "Xác thực thất bại.");
            });
    }, [searchParams]);

    return (
        <div className="authPage" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
            <div className="authCard" style={{ textAlign: "center", padding: "40px" }}>
                <div className="authLogo">
                    <div className="name">WNP</div>
                </div>

                <h2 className="authTitle" style={{ marginTop: "20px" }}>Xác thực Email</h2>

                {status === "loading" && <p>Đang xác thực, vui lòng chờ...</p>}

                {status === "success" && (
                    <div>
                        <div style={{ color: "#28a745", fontSize: "48px", marginBottom: "20px" }}>✅</div>
                        <p style={{ marginBottom: "24px" }}>{message}</p>
                        <Link to="/login" className="btn btn-primary btn-full">Đăng nhập ngay</Link>
                    </div>
                )}

                {status === "error" && (
                    <div>
                        <div style={{ color: "#dc3545", fontSize: "48px", marginBottom: "20px" }}>❌</div>
                        <p style={{ marginBottom: "24px" }}>{message}</p>
                        <Link to="/register" className="btn btn-full" style={{ border: "1px solid var(--line)" }}>Thử đăng ký lại</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
