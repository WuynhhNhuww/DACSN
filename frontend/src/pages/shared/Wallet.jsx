import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const MIN_DEPOSIT  = 10000;
const MIN_WITHDRAW = 50000;

const fmt = (n) => Number(n || 0).toLocaleString("vi-VN") + " ₫";

const TXN_LABEL = {
  DEPOSIT       : "Nạp tiền",
  WITHDRAW      : "Rút tiền",
  ORDER_PAYMENT : "Thanh toán đơn",
  SELLER_REVENUE: "Doanh thu",
  ORDER_REFUND  : "Hoàn tiền",
  SYSTEM_COMMISSION: "Hoa hồng Admin"
};
const IS_CREDIT = { DEPOSIT: true, ORDER_REFUND: true, SELLER_REVENUE: true, SYSTEM_COMMISSION: true };

// ─── tiny helpers ──────────────────────────────────────────
const S = {
  page: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    WebkitFontSmoothing: "antialiased",
    minHeight: "100vh",
    background: "linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#fff0f8 100%)",
    padding: "32px 24px 60px",
  },
  card: (extra = {}) => ({
    background: "white",
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    border: "1px solid rgba(0,0,0,0.07)",
    ...extra,
  }),
};

export default function SharedWallet() {
  const { user } = useContext(AuthContext) || {};
  const [wallet, setWallet]           = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const [modal, setModal]       = useState(null); // "DEPOSIT" | "WITHDRAW" | null
  const [amount, setAmount]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErr, setFieldErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const tok = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/wallets", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      setWallet(data.wallet);
      setTransactions(data.transactions);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openModal = (type) => { setModal(type); setAmount(""); setFieldErr(""); };
  const closeModal = () => { setModal(null); setAmount(""); setFieldErr(""); };

  const validate = (val) => {
    const n = Number(val);
    if (!val || isNaN(n) || n <= 0) return "Vui lòng nhập số tiền hợp lệ.";
    if (modal === "DEPOSIT"  && n < MIN_DEPOSIT)          return `Số tiền nạp tối thiểu là ${fmt(MIN_DEPOSIT)}.`;
    if (modal === "WITHDRAW" && n < MIN_WITHDRAW)         return `Số tiền rút tối thiểu là ${fmt(MIN_WITHDRAW)}.`;
    if (modal === "WITHDRAW" && n > (wallet?.balance||0)) return "Số dư không đủ.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(amount);
    if (err) { setFieldErr(err); return; }

    setSubmitting(true);
    try {
      const tok = localStorage.getItem("token");
      const endpoint = modal === "DEPOSIT"
        ? "http://localhost:5000/api/wallets/vnpay-create"
        : "http://localhost:5000/api/wallets/vnpay-withdraw";

      const { data } = await axios.post(
        endpoint,
        { amount: Number(amount) },
        { headers: { Authorization: `Bearer ${tok}` } }
      );
      if (data.paymentUrl) window.location.href = data.paymentUrl;
    } catch (e) {
      setFieldErr(e.response?.data?.message || "Giao dịch thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────
  if (loading) return (
    <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center", gap:14 }}>
      <div style={{
        width:28, height:28, borderRadius:"50%",
        border:"3px solid #e2e8f0", borderTopColor:"#6366f1",
        animation:"wspin 0.7s linear infinite",
      }}/>
      <span style={{ color:"#64748b", fontSize:"0.95rem" }}>Đang tải ví...</span>
      <style>{`@keyframes wspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", color:"#dc2626" }}>
        <div style={{ fontSize:"2.5rem", marginBottom:8 }}>⚠️</div>
        <div style={{ fontWeight:600, fontFamily:"Inter,sans-serif" }}>{error}</div>
      </div>
    </div>
  );

  // ─── Main render ───────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes wspin{to{transform:rotate(360deg)}}
        @keyframes wfadeIn{from{opacity:0}to{opacity:1}}
        @keyframes wslideUp{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .wqbtn:hover{background:#6366f1!important;color:white!important;border-color:#6366f1!important}
        .wqbtn.wactive{background:#6366f1!important;color:white!important;border-color:#6366f1!important}
        .wrow:hover{background:#fafafe!important}
        .wbtn-ghost:hover{background:#f1f5f9!important}
      `}</style>

      {/* ── Page Title ─────────────────────────────────── */}
      <div style={{ maxWidth:960, margin:"0 auto 28px", fontFamily:"Inter,sans-serif" }}>
        <div style={{ fontSize:"1.6rem", fontWeight:900, color:"#0f172a", letterSpacing:"-0.03em", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{
            width:42, height:42, borderRadius:14,
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"1.1rem", flexShrink:0,
            boxShadow:"0 6px 16px rgba(99,102,241,0.35)",
          }}>💳</span>
          Ví ShopeePay
        </div>
        <div style={{ fontSize:"0.82rem", color:"#64748b", marginTop:4, marginLeft:52 }}>
          Quản lý số dư và giao dịch của bạn · Tất cả giao dịch qua VNPay
        </div>
      </div>

      {/* ── Cards Row ──────────────────────────────────── */}
      <div style={{
        maxWidth:960, margin:"0 auto 24px",
        display:"grid",
        gridTemplateColumns:"1fr 240px",
        gap:20,
      }}>
        {/* Balance Hero */}
        <div style={{
          borderRadius:24,
          background:"linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#a855f7 100%)",
          padding:"32px 28px",
          color:"white",
          boxShadow:"0 16px 48px rgba(79,70,229,0.32)",
          position:"relative",
          overflow:"hidden",
          fontFamily:"Inter,sans-serif",
        }}>
          {/* decorative orbs */}
          <div style={{ position:"absolute", width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.07)", top:-60, right:-40, pointerEvents:"none" }}/>
          <div style={{ position:"absolute", width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)", bottom:-30, left:20, pointerEvents:"none" }}/>

          <div style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", opacity:0.65, marginBottom:10 }}>
            💰 Số dư khả dụng
          </div>
          <div style={{ fontSize:"2.8rem", fontWeight:900, letterSpacing:"-0.04em", lineHeight:1, marginBottom:6 }}>
            {fmt(wallet?.balance)}
          </div>
          <div style={{ fontSize:"0.8rem", opacity:0.55, marginBottom:28 }}>
            {user?.name || "Tài khoản của bạn"}
          </div>

          {/* Action Buttons */}
          <div style={{ display:"flex", gap:12 }}>
            <button
              id="btn-nap-tien"
              onClick={() => openModal("DEPOSIT")}
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"11px 22px",
                background:"white", color:"#4f46e5",
                border:"none", borderRadius:40,
                fontWeight:800, fontSize:"0.88rem",
                cursor:"pointer", fontFamily:"Inter,sans-serif",
                boxShadow:"0 4px 16px rgba(0,0,0,0.15)",
                transition:"all 0.2s",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.2)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.15)"; }}
            >
              ↓ Nạp tiền
            </button>
            <button
              id="btn-rut-tien"
              onClick={() => openModal("WITHDRAW")}
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"11px 22px",
                background:"rgba(255,255,255,0.15)", color:"white",
                border:"1.5px solid rgba(255,255,255,0.35)",
                borderRadius:40,
                fontWeight:800, fontSize:"0.88rem",
                cursor:"pointer", fontFamily:"Inter,sans-serif",
                backdropFilter:"blur(8px)",
                transition:"all 0.2s",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.25)"; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.15)"; e.currentTarget.style.transform=""; }}
            >
              ↑ Rút tiền
            </button>
          </div>
        </div>

        {/* Side Info */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Frozen */}
          <div style={{ ...S.card(), padding:"20px 20px" }}>
            <div style={{ fontSize:"0.72rem", color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8, fontFamily:"Inter,sans-serif" }}>
              ⏳ Đang chờ xử lý
            </div>
            <div style={{ fontSize:"1.5rem", fontWeight:900, color:"#b45309", letterSpacing:"-0.03em", fontFamily:"Inter,sans-serif" }}>
              {fmt(wallet?.frozenBalance)}
            </div>
            <div style={{ fontSize:"0.7rem", color:"#94a3b8", marginTop:4, fontFamily:"Inter,sans-serif" }}>
              Chờ đối soát / Admin duyệt
            </div>
          </div>

          {/* Limits */}
          <div style={{ ...S.card(), padding:"18px 20px" }}>
            <div style={{ fontSize:"0.7rem", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10, fontFamily:"Inter,sans-serif" }}>
              📋 Hạn mức
            </div>
            {[
              { label:"Nạp tối thiểu", val: fmt(MIN_DEPOSIT),  color:"#059669", icon:"↓" },
              { label:"Rút tối thiểu", val: fmt(MIN_WITHDRAW), color:"#dc2626", icon:"↑" },
            ].map(r => (
              <div key={r.label} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"7px 0", borderBottom:"1px solid #f1f5f9",
                fontFamily:"Inter,sans-serif",
              }}>
                <span style={{ fontSize:"0.78rem", color:"#64748b" }}>{r.icon} {r.label}</span>
                <span style={{ fontSize:"0.82rem", fontWeight:700, color: r.color }}>{r.val}</span>
              </div>
            ))}
            <div style={{
              display:"flex", alignItems:"center", gap:6,
              marginTop:10, padding:"8px 10px",
              background:"#eff6ff", borderRadius:10,
              fontSize:"0.7rem", color:"#1d4ed8", fontWeight:600,
              fontFamily:"Inter,sans-serif",
            }}>
              🔒 Bảo mật qua VNPay 2.1.0
            </div>
          </div>
        </div>
      </div>

      {/* ── Transaction Table ───────────────────────────── */}
      <div style={{ maxWidth:960, margin:"0 auto", fontFamily:"Inter,sans-serif" }}>
        <div style={{ fontWeight:700, fontSize:"1rem", color:"#0f172a", marginBottom:14, letterSpacing:"-0.01em" }}>
          📜 Lịch sử giao dịch
        </div>
        <div style={{ ...S.card(), overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Thời gian","Loại giao dịch","Số tiền","Mô tả","Trạng thái"].map(h => (
                  <th key={h} style={{
                    padding:"12px 18px", textAlign:"left",
                    fontSize:"0.72rem", fontWeight:700,
                    color:"#64748b", textTransform:"uppercase",
                    letterSpacing:"0.06em",
                    borderBottom:"1px solid #f1f5f9",
                    whiteSpace:"nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding:"56px 24px", textAlign:"center", color:"#94a3b8", fontSize:"0.9rem" }}>
                    Chưa có giao dịch nào
                  </td>
                </tr>
              ) : transactions.map(txn => {
                const credit = IS_CREDIT[txn.type];
                const statusMap = {
                  COMPLETED:{ label:"Hoàn thành", bg:"#d1fae5", color:"#065f46" },
                  PENDING:  { label:"Đang chờ",   bg:"#fef3c7", color:"#92400e" },
                  FAILED:   { label:"Thất bại",   bg:"#ffe4e6", color:"#9f1239" },
                };
                const st = statusMap[txn.status] || statusMap.PENDING;
                return (
                  <tr key={txn._id} className="wrow" style={{ borderBottom:"1px solid #f8fafc", transition:"background 0.15s" }}>
                    <td style={{ padding:"14px 18px", fontSize:"0.8rem", color:"#64748b", whiteSpace:"nowrap" }}>
                      {new Date(txn.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{
                        display:"inline-flex", alignItems:"center", gap:5,
                        padding:"3px 10px", borderRadius:20,
                        fontSize:"0.72rem", fontWeight:700,
                        textTransform:"uppercase", letterSpacing:"0.05em",
                        background: credit ? "#d1fae5" : "#ffe4e6",
                        color: credit ? "#065f46" : "#9f1239",
                      }}>
                        {credit ? "↓" : "↑"} {TXN_LABEL[txn.type] || txn.type}
                      </span>
                    </td>
                    <td style={{
                      padding:"14px 18px",
                      fontWeight:800, fontSize:"0.95rem",
                      color: credit ? "#059669" : "#dc2626",
                      letterSpacing:"-0.02em",
                    }}>
                      {credit ? "+" : "-"}{fmt(txn.amount)}
                    </td>
                    <td style={{ padding:"14px 18px", fontSize:"0.82rem", color:"#64748b", maxWidth:200 }}>
                      {txn.description || "—"}
                    </td>
                    <td style={{ padding:"14px 18px" }}>
                      <span style={{
                        display:"inline-flex", alignItems:"center", gap:5,
                        padding:"3px 10px", borderRadius:20,
                        fontSize:"0.72rem", fontWeight:700,
                        background: st.bg, color: st.color,
                      }}>
                        {txn.status === "COMPLETED" ? "✓" : txn.status === "PENDING" ? "⏳" : "✗"} {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────── */}
      {modal && (
        <div
          onClick={closeModal}
          style={{
            position:"fixed", inset:0,
            background:"rgba(15,23,42,0.6)",
            backdropFilter:"blur(8px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:9999, padding:20,
            animation:"wfadeIn 0.2s ease",
            fontFamily:"Inter,sans-serif",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:"white",
              borderRadius:24,
              width:"100%", maxWidth:440,
              overflow:"hidden",
              boxShadow:"0 32px 80px rgba(0,0,0,0.22)",
              animation:"wslideUp 0.25s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* Modal header */}
            <div style={{
              padding:"22px 24px",
              background: modal === "DEPOSIT"
                ? "linear-gradient(135deg,#059669,#10b981)"
                : "linear-gradient(135deg,#dc2626,#f43f5e)",
              color:"white",
              display:"flex", alignItems:"center", gap:14,
            }}>
              <div style={{
                width:46, height:46, borderRadius:14,
                background:"rgba(255,255,255,0.2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.3rem", flexShrink:0,
              }}>
                {modal === "DEPOSIT" ? "↓" : "↑"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:"1.05rem" }}>
                  {modal === "DEPOSIT" ? "Nạp tiền vào ví" : "Rút tiền về ngân hàng"}
                </div>
                <div style={{ fontSize:"0.75rem", opacity:0.72, marginTop:2 }}>
                  {modal === "DEPOSIT"
                    ? `Tối thiểu ${fmt(MIN_DEPOSIT)} · Qua cổng VNPay`
                    : `Tối thiểu ${fmt(MIN_WITHDRAW)} · Qua cổng VNPay`}
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width:32, height:32, borderRadius:10,
                  background:"rgba(255,255,255,0.18)", border:"none",
                  color:"white", cursor:"pointer", fontSize:"1rem",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}
              >✕</button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} style={{ padding:"24px" }}>
              {/* Balance hint */}
              <div style={{
                display:"flex", justifyContent:"space-between",
                padding:"10px 14px",
                background:"#f8fafc", borderRadius:12,
                border:"1px solid #e2e8f0",
                marginBottom:20,
              }}>
                <span style={{ fontSize:"0.8rem", color:"#64748b" }}>Số dư hiện tại</span>
                <span style={{ fontWeight:800, color:"#0f172a", fontSize:"0.88rem" }}>{fmt(wallet?.balance)}</span>
              </div>

              {/* Amount input */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontWeight:700, fontSize:"0.83rem", color:"#0f172a", marginBottom:8 }}>
                  Số tiền (VNĐ)
                </label>
                <div style={{
                  display:"flex",
                  border: fieldErr ? "2px solid #f43f5e" : "2px solid #e2e8f0",
                  borderRadius:14,
                  overflow:"hidden",
                  transition:"border-color 0.2s",
                }}>
                  <div style={{
                    padding:"0 14px",
                    background:"#f8fafc",
                    borderRight:"2px solid #e2e8f0",
                    display:"flex", alignItems:"center",
                    fontWeight:700, color:"#64748b", fontSize:"1rem",
                    userSelect:"none", height:52,
                  }}>₫</div>
                  <input
                    id="wallet-amount-input"
                    type="number"
                    min={modal === "DEPOSIT" ? MIN_DEPOSIT : MIN_WITHDRAW}
                    step={10000}
                    required
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setFieldErr(""); }}
                    onBlur={e => { if(e.target.value) setFieldErr(validate(e.target.value)); }}
                    placeholder={modal === "DEPOSIT" ? "VD: 100000" : "VD: 200000"}
                    style={{
                      flex:1, border:"none", outline:"none",
                      padding:"0 16px", fontSize:"1.05rem",
                      fontWeight:700, color:"#0f172a",
                      height:52, background:"transparent",
                      fontFamily:"Inter,sans-serif",
                    }}
                  />
                </div>
                {fieldErr && (
                  <div style={{
                    marginTop:8, padding:"8px 12px",
                    background:"#ffe4e6", borderRadius:10,
                    fontSize:"0.78rem", color:"#9f1239", fontWeight:600,
                    display:"flex", alignItems:"center", gap:6,
                  }}>
                    ⚠️ {fieldErr}
                  </div>
                )}
              </div>

              {/* Quick amount */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
                {[50000,100000,200000,500000].map(v => (
                  <button
                    key={v}
                    type="button"
                    className={`wqbtn${Number(amount)===v?" wactive":""}`}
                    onClick={() => { setAmount(String(v)); setFieldErr(""); }}
                    style={{
                      padding:"6px 14px",
                      borderRadius:20,
                      border:"1.5px solid #e2e8f0",
                      background:"white",
                      color:"#64748b",
                      fontSize:"0.78rem",
                      fontWeight:600,
                      cursor:"pointer",
                      fontFamily:"Inter,sans-serif",
                      transition:"all 0.15s",
                    }}
                  >
                    {v.toLocaleString("vi-VN")}₫
                  </button>
                ))}
              </div>

              {/* VNPay info */}
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 14px",
                background:"#eff6ff", border:"1.5px solid #bfdbfe",
                borderRadius:14, marginBottom:24,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{
                    width:36, height:36, borderRadius:10,
                    background:"#1a56db",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"1.1rem", flexShrink:0,
                  }}>🏦</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:"0.85rem", color:"#1d4ed8" }}>Cổng thanh toán VNPay</div>
                    <div style={{ fontSize:"0.7rem", color:"#3b82f6" }}>Bạn sẽ được chuyển sang trang ngân hàng VNPay</div>
                  </div>
                </div>
                <span style={{ fontSize:"1rem" }}>🔒</span>
              </div>

              {/* Action buttons */}
              <div style={{ display:"flex", gap:12 }}>
                <button
                  type="button"
                  className="wbtn-ghost"
                  disabled={submitting}
                  onClick={closeModal}
                  style={{
                    flex:1, padding:"13px",
                    border:"1.5px solid #e2e8f0",
                    borderRadius:14,
                    background:"white",
                    color:"#64748b",
                    fontWeight:700, fontSize:"0.88rem",
                    cursor:"pointer", fontFamily:"Inter,sans-serif",
                    transition:"background 0.15s",
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  id="wallet-submit-btn"
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex:2, padding:"13px",
                    border:"none", borderRadius:14,
                    background: submitting ? "#94a3b8" : modal === "DEPOSIT"
                      ? "linear-gradient(135deg,#10b981,#059669)"
                      : "linear-gradient(135deg,#f43f5e,#dc2626)",
                    color:"white",
                    fontWeight:800, fontSize:"0.88rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily:"Inter,sans-serif",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    boxShadow: modal === "DEPOSIT"
                      ? "0 6px 20px rgba(16,185,129,0.35)"
                      : "0 6px 20px rgba(244,63,94,0.35)",
                    transition:"all 0.2s",
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{ width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white",animation:"wspin 0.7s linear infinite" }}/>
                      Đang xử lý...
                    </>
                  ) : (
                    <>{modal === "DEPOSIT" ? "↓ Nạp tiền qua VNPay" : "↑ Rút tiền qua VNPay"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
