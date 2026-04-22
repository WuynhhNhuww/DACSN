import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function VNPayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null); // { status, type, amount, message }

  useEffect(() => {
    const code    = searchParams.get("vnp_ResponseCode");
    const txnRef  = searchParams.get("vnp_TxnRef") || "";
    const amountRaw = Number(searchParams.get("vnp_Amount") || 0) / 100;
    const isWithdraw = txnRef.includes("_WIT_");
    const msg     = searchParams.get("message");

    setInfo({
      success  : code === "00",
      isWithdraw,
      amount   : amountRaw,
      message  : msg,
    });
  }, [searchParams]);

  if (!info) return null;

  const { success, isWithdraw, amount, message } = info;

  return (
    <div style={{
      minHeight: "70vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)",
    }}>
      <div style={{
        background: "white",
        borderRadius: 28,
        padding: "48px 40px",
        maxWidth: 460,
        width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
        textAlign: "center",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>

        {/* Icon */}
        <div style={{
          width: 88, height: 88,
          borderRadius: "50%",
          background: success
            ? "linear-gradient(135deg, #10b981, #059669)"
            : "linear-gradient(135deg, #f43f5e, #dc2626)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: success
            ? "0 12px 32px rgba(16,185,129,0.35)"
            : "0 12px 32px rgba(244,63,94,0.35)",
          fontSize: "2.2rem",
        }}>
          {success ? "✓" : "✗"}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "1.55rem",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 8px",
          letterSpacing: "-0.03em",
        }}>
          {success
            ? (isWithdraw ? "Rút tiền thành công!" : "Nạp tiền thành công!")
            : (isWithdraw ? "Rút tiền thất bại" : "Nạp tiền thất bại")}
        </h1>

        {/* Amount */}
        {amount > 0 && (
          <div style={{
            fontSize: "2rem",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: success ? "#059669" : "#dc2626",
            margin: "12px 0",
          }}>
            {isWithdraw ? "-" : "+"}{amount.toLocaleString("vi-VN")} ₫
          </div>
        )}

        {/* VNPay badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          background: "#eff6ff",
          border: "1.5px solid #bfdbfe",
          borderRadius: 20,
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "#1d4ed8",
          margin: "4px 0 20px",
        }}>
          🔒 Xử lý qua cổng VNPay
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: "12px 16px",
            background: success ? "#d1fae5" : "#ffe4e6",
            borderRadius: 12,
            fontSize: "0.85rem",
            color: success ? "#065f46" : "#9f1239",
            fontWeight: 500,
            marginBottom: 8,
          }}>
            {decodeURIComponent(message.replace(/\+/g, " "))}
          </div>
        )}

        {/* Sub message */}
        <p style={{
          fontSize: "0.83rem",
          color: "#64748b",
          margin: "8px 0 32px",
          lineHeight: 1.6,
        }}>
          {success
            ? isWithdraw
              ? "Tiền sẽ được chuyển về tài khoản ngân hàng của bạn trong 1-3 ngày làm việc."
              : "Số dư ví của bạn đã được cập nhật thành công."
            : "Giao dịch chưa được xử lý. Vui lòng thử lại hoặc liên hệ hỗ trợ."}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          {!success && (
            <button
              onClick={() => navigate("/buyer/wallet")}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                border: "1.5px solid #e2e8f0",
                background: "#f8fafc",
                color: "#334155",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
            >
              ← Quay lại
            </button>
          )}
          <button
            onClick={() => navigate("/buyer/wallet")}
            style={{
              flex: 2,
              padding: "14px",
              borderRadius: 14,
              border: "none",
              background: success
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: success
                ? "0 6px 20px rgba(16,185,129,0.35)"
                : "0 6px 20px rgba(99,102,241,0.35)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"}
            onMouseLeave={e => e.currentTarget.style.filter = ""}
          >
            {success ? "Xem ví của tôi →" : "Thử lại →"}
          </button>
        </div>
      </div>
    </div>
  );
}
