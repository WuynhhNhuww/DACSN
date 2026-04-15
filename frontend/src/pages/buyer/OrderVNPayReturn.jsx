import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaArrowRight } from "react-icons/fa";
import ShopeeFooter from "../../components/ShopeeFooter";

export default function OrderVNPayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    const vnpMessage = searchParams.get("message");
    const vnpOrderId = searchParams.get("orderId");

    if (vnpResponseCode === "00") {
      setStatus("success");
      setMessage(vnpMessage || "Thanh toán đơn hàng thành công!");
      setOrderId(vnpOrderId);
      
      // Xóa giỏ hàng local
      localStorage.removeItem("modern_store_cart");
      window.dispatchEvent(new Event("cart:updated"));
    } else {
      setStatus("error");
      setMessage(vnpMessage || "Giao dịch không thành công hoặc đã bị hủy.");
    }
  }, [searchParams]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div className="card" style={{ maxWidth: 500, width: "100%", padding: 48, textAlign: "center", borderRadius: 32, boxShadow: "var(--shadow-lg)" }}>
          {status === "loading" && (
            <>
              <div className="animate-spin" style={{ width: 64, height: 64, border: "4px solid var(--primary-light)", borderTopColor: "var(--primary)", borderRadius: "50%", margin: "0 auto 24px" }}></div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Đang xác thực thanh toán...</h2>
              <p style={{ color: "var(--text-light)" }}>Vui lòng không đóng trình duyệt hoặc chuyển trang.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={{ width: 80, height: 80, background: "#10b98120", color: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px" }}>
                <FaCheckCircle />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Thanh toán thành công!</h2>
              <p style={{ color: "#059669", fontWeight: 600, marginBottom: 32 }}>{message}</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button 
                  onClick={() => navigate(`/buyer/orders/${orderId}`)}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "16px", borderRadius: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  Xem chi tiết đơn hàng <FaArrowRight />
                </button>
                <button 
                  onClick={() => navigate("/home")}
                  className="btn"
                  style={{ width: "100%", padding: "16px", borderRadius: 16, fontWeight: 700, background: "var(--primary-light)", color: "var(--primary)", border: "none" }}
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div style={{ width: 80, height: 80, background: "#f43f5e20", color: "#f43f5e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 24px" }}>
                <FaTimesCircle />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Thanh toán thất bại</h2>
              <p style={{ color: "#e11d48", fontWeight: 600, marginBottom: 32 }}>{message}</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button 
                  onClick={() => navigate("/buyer/orders")}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "16px", borderRadius: 16, fontWeight: 700 }}
                >
                  Kiểm tra danh sách đơn hàng
                </button>
                <button 
                  onClick={() => navigate("/home")}
                  className="btn"
                  style={{ width: "100%", padding: "16px", borderRadius: 16, fontWeight: 700, background: "#f1f5f9", color: "var(--text-light)", border: "none" }}
                >
                  Về Trang chủ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <ShopeeFooter />
    </div>
  );
}
