import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaMapMarkerAlt, FaCreditCard, FaTicketAlt, FaStore, FaChevronRight } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import ShopeeFooter from "../../components/ShopeeFooter";

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const [items, setItems] = useState(location.state?.selectedItems || []);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");

    const [address, setAddress] = useState({
        fullName: user?.name || "",
        phone: "0901234567",
        province: "Ho Chi Minh City",
        district: "Binh Thanh District",
        ward: "Ward 15",
        detail: "123 Dien Bien Phu Street",
    });
    const [paymentMethod, setPaymentMethod] = useState("COD");

    const [couponCode, setCouponCode] = useState("");
    const [appliedFreeship, setAppliedFreeship] = useState(null);
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [couponMessage, setCouponMessage] = useState("");
    const [showVoucherModal, setShowVoucherModal] = useState(false);

    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [savedVoucherCodes, setSavedVoucherCodes] = useState([]);

    useEffect(() => {
        if (user && (user.role === "seller" || user.role === "admin")) {
            navigate("/home");
            return;
        }
        if (!items || items.length === 0) {
            navigate("/buyer/cart");
            return;
        }

        Promise.all([
            axiosClient.get("/api/users/vouchers").catch(() => ({ data: [] })),
            axiosClient.get("/api/vouchers").catch(() => ({ data: [] }))
        ]).then(([resSaved, resAll]) => {
            setSavedVoucherCodes(resSaved.data || []);
            const mapped = (resAll.data || []).map(v => ({
                code: v.code,
                title: v.name,
                desc: v.type === "percentage" ? `Giảm ${v.value}%` : `Giảm ${Number(v.value).toLocaleString("vi-VN")}₫`,
                type: "discount",
                value: v.value,
                valueType: v.type, // 'percentage' | 'fixed'
                minOrder: v.minOrderValue || 0,
                scope: v.scope,
                sellerId: v.sellerId
            }));
            setAvailableVouchers(mapped);
        }).finally(() => setLoading(false));
    }, [items, navigate, user]);

    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const shippingFee = subtotal >= 500000 || items.length === 0 ? 0 : 30000;

    const freeshipAmount = appliedFreeship ? Math.min(shippingFee, appliedFreeship.value) : 0;
    
    let computedDiscountAmount = 0;
    if (appliedDiscount) {
        if (appliedDiscount.valueType === "percentage") {
            computedDiscountAmount = (subtotal * appliedDiscount.value) / 100;
        } else {
            computedDiscountAmount = appliedDiscount.value;
        }
    }
    const discountAmount = Math.min(subtotal, computedDiscountAmount);

    const total = Math.max(0, subtotal + shippingFee - freeshipAmount - discountAmount);

    const handleSelectFreeship = (v) => {
        if (appliedFreeship?.code === v.code) setAppliedFreeship(null);
        else setAppliedFreeship(v);
    };

    const handleSelectDiscount = (v) => {
        if (appliedDiscount?.code === v.code) setAppliedDiscount(null);
        else setAppliedDiscount(v);
    };

    const groupedItems = useMemo(() => {
        const groups = {};
        items.forEach(it => {
            const shopId = it.seller?._id || "unknown";
            if (!groups[shopId]) {
                groups[shopId] = {
                    shopId,
                    shopName: it.seller?.sellerInfo?.shopName || "Modern Partner",
                    items: []
                };
            }
            groups[shopId].items.push(it);
        });
        return Object.values(groups);
    }, [items]);


    const handleApplyTextVoucher = () => {
        const v = availableVouchers.find(x => x.code === couponCode.trim().toUpperCase());
        if (v) {
            const disabled = subtotal < v.minOrder || (v.type === "shipping" && shippingFee === 0);
            if (disabled) {
                setCouponMessage("Requirements not met for this voucher.");
            } else {
                if (v.type === "shipping") setAppliedFreeship(v);
                else setAppliedDiscount(v);
                setCouponMessage("Voucher applied successfully!");
                setCouponCode("");
            }
        } else {
            setCouponMessage("Invalid voucher code.");
        }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (items.length === 0) return setError("Your bag is empty!");

        setPlacing(true);
        setError("");

        try {
            const orderData = {
                items: items.map(it => it.id || it.product),
                shippingAddress: address,
                paymentMethod,
                itemsPrice: subtotal,
                shippingFee: shippingFee,
                discountAmount: freeshipAmount + discountAmount,
                totalPrice: total
            };

            const res = await axiosClient.post("/api/orders", orderData);

            if (res.data.paymentUrl) {
                // If VNPay is selected, redirect to the payment gateway
                window.location.href = res.data.paymentUrl;
                return;
            }

            localStorage.removeItem("modern_store_cart");
            try {
                await axiosClient.delete("/api/cart/clear");
            } catch (err) { }

            window.dispatchEvent(new Event("cart:updated"));
            navigate(`/buyer/orders/${res.data._id}`);
        } catch (err) {
            setError(err?.response?.data?.message || "Order failed. Please try again.");
            setPlacing(false);
        }
    };

    if (loading) return <div className="loading" style={{ marginTop: 60 }}>Preparing checkout...</div>;

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 80 }}>
            <div className="container" style={{ paddingTop: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>Checkout</h1>
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 24, borderRadius: 12 }}>
                        {error}
                        {error.includes("ShopeePay") && (
                            <span style={{ marginLeft: 8 }}>
                                <button className="linkBtn" onClick={() => navigate('/buyer/wallet')} style={{ textDecoration: 'underline', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Nạp ngay</button>
                            </span>
                        )}
                    </div>
                )}

                <div className="cartGrid" style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 32, alignItems: "start" }}>
                    <div className="cartLeft">
                        {/* Shipping Address */}
                        <div className="card" style={{ marginBottom: 24, padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                            <h3 style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, fontSize: 18, fontWeight: 700 }}>
                                <FaMapMarkerAlt style={{ color: "var(--primary)" }} /> Shipping Address
                            </h3>
                            <div className="formGroup" style={{ marginBottom: 20 }}>
                                <label className="formLabel" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-light)", marginBottom: 8, display: "block" }}>Full Name</label>
                                <input className="formControl" value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} style={{ borderRadius: 12, padding: "12px 16px" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                                <div className="formGroup">
                                    <label className="formLabel" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-light)", marginBottom: 8, display: "block" }}>Province/City</label>
                                    <input className="formControl" value={address.province} onChange={e => setAddress({ ...address, province: e.target.value })} style={{ borderRadius: 12, padding: "12px 16px" }} />
                                </div>
                                <div className="formGroup">
                                    <label className="formLabel" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-light)", marginBottom: 8, display: "block" }}>District</label>
                                    <input className="formControl" value={address.district} onChange={e => setAddress({ ...address, district: e.target.value })} style={{ borderRadius: 12, padding: "12px 16px" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                <div className="formGroup">
                                    <label className="formLabel" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-light)", marginBottom: 8, display: "block" }}>Ward/Commune</label>
                                    <input className="formControl" value={address.ward} onChange={e => setAddress({ ...address, ward: e.target.value })} style={{ borderRadius: 12, padding: "12px 16px" }} />
                                </div>
                                <div className="formGroup">
                                    <label className="formLabel" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-light)", marginBottom: 8, display: "block" }}>Street Detail</label>
                                    <input className="formControl" value={address.detail} onChange={e => setAddress({ ...address, detail: e.target.value })} style={{ borderRadius: 12, padding: "12px 16px" }} />
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="card" style={{ marginBottom: 24, padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                            <h3 style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, fontSize: 18, fontWeight: 700 }}>
                                <FaStore style={{ color: "var(--primary)" }} /> Order Summary ({items.length} items)
                            </h3>
                            {groupedItems.map((group, gIdx) => (
                                <div key={group.shopId} style={{ marginBottom: gIdx === groupedItems.length - 1 ? 0 : 32, borderBottom: gIdx === groupedItems.length - 1 ? "none" : "1px solid var(--line)", paddingBottom: gIdx === groupedItems.length - 1 ? 0 : 24 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "var(--text)" }}>
                                        {group.shopName}
                                    </div>
                                    {group.items.map((it, idx) => (
                                        <div key={it.id || idx} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                                            <div style={{ width: 64, height: 64, borderRadius: 12, background: "#f8fafc", overflow: "hidden", flexShrink: 0 }}>
                                                {it.image ? <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.2 }}>📦</span>}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{it.name}</div>
                                                <div style={{ fontSize: 13, color: "var(--text-light)" }}>Quantity: {it.qty}</div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{fmt(it.price * it.qty)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Payment Method */}
                        <div className="card" style={{ padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                            <h3 style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, fontSize: 18, fontWeight: 700 }}>
                                <FaCreditCard style={{ color: "var(--primary)" }} /> Payment Method
                            </h3>
                            <div style={{ display: "grid", gap: 12 }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", padding: "16px 20px", borderRadius: 16, border: paymentMethod === "COD" ? "2px solid var(--primary)" : "2px solid var(--line)", background: paymentMethod === "COD" ? "var(--primary-light)" : "transparent", transition: "all 0.2s" }}>
                                    <input type="radio" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} style={{ width: 18, height: 18 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Cash on Delivery (COD)</div>
                                        <div style={{ fontSize: 12, color: "var(--text-light)" }}>Pay when you receive your order</div>
                                    </div>
                                    <span style={{ fontSize: 20 }}>💵</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", padding: "16px 20px", borderRadius: 16, border: paymentMethod === "ONLINE" ? "2px solid var(--primary)" : "2px solid var(--line)", background: paymentMethod === "ONLINE" ? "var(--primary-light)" : "transparent", transition: "all 0.2s" }}>
                                    <input type="radio" checked={paymentMethod === "ONLINE"} onChange={() => setPaymentMethod("ONLINE")} style={{ width: 18, height: 18 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Online Payment</div>
                                        <div style={{ fontSize: 12, color: "var(--text-light)" }}>Credit Card / Bank Transfer (Mock)</div>
                                    </div>
                                    <span style={{ fontSize: 20 }}>💳</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", padding: "16px 20px", borderRadius: 16, border: paymentMethod === "WALLET" ? "2px solid var(--primary)" : "2px solid var(--line)", background: paymentMethod === "WALLET" ? "var(--primary-light)" : "transparent", transition: "all 0.2s" }}>
                                    <input type="radio" checked={paymentMethod === "WALLET"} onChange={() => setPaymentMethod("WALLET")} style={{ width: 18, height: 18 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Ví ShopeePay (E-Wallet)</div>
                                        <div style={{ fontSize: 12, color: "var(--text-light)" }}>Thanh toán an toàn, không lo tiền lẻ</div>
                                    </div>
                                    <span style={{ fontSize: 20 }}>💰</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", padding: "16px 20px", borderRadius: 16, border: paymentMethod === "MOMO" ? "2px solid var(--primary)" : "2px solid var(--line)", background: paymentMethod === "MOMO" ? "var(--primary-light)" : "transparent", transition: "all 0.2s" }}>
                                    <input type="radio" checked={paymentMethod === "MOMO"} onChange={() => setPaymentMethod("MOMO")} style={{ width: 18, height: 18 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>Ví MoMo (Cổng thanh toán)</div>
                                        <div style={{ fontSize: 12, color: "var(--text-light)" }}>Thanh toán qua ứng dụng MoMo / QR Code</div>
                                    </div>
                                    <span style={{ fontSize: 20 }}>🧧</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", padding: "16px 20px", borderRadius: 16, border: paymentMethod === "VNPAY" ? "2px solid var(--primary)" : "2px solid var(--line)", background: paymentMethod === "VNPAY" ? "var(--primary-light)" : "transparent", transition: "all 0.2s" }}>
                                    <input type="radio" checked={paymentMethod === "VNPAY"} onChange={() => setPaymentMethod("VNPAY")} style={{ width: 18, height: 18 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>VNPay (Thanh toán qua Ngân hàng)</div>
                                        <div style={{ fontSize: 12, color: "var(--text-light)" }}>Internet Banking / QR Code (User Merchant)</div>
                                    </div>
                                    <span style={{ fontSize: 20 }}>🏦</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="cartRight" style={{ position: "sticky", top: 120 }}>
                        <div className="cartSummary" style={{ background: "#fff", padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                            {/* Voucher Section */}
                            <div style={{ marginBottom: 32, padding: "16px 20px", borderRadius: 16, background: "var(--primary-light)", border: "1px dashed var(--primary)" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: appliedFreeship || appliedDiscount ? 12 : 0 }}>
                                    <span style={{ fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                                        <FaTicketAlt /> Vouchers Của Bạn
                                    </span>
                                    <button
                                        className="linkBtn"
                                        style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
                                        onClick={() => setShowVoucherModal(true)}
                                    >
                                        Chọn Voucher <FaChevronRight size={10} />
                                    </button>
                                </div>
                                {appliedFreeship && (
                                    <div style={{ fontSize: 13, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(79, 70, 229, 0.1)", color: "var(--primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>Phí vận chuyển: <b>{appliedFreeship.code}</b></span>
                                        <button style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 600 }} onClick={() => setAppliedFreeship(null)}>Bỏ chọn</button>
                                    </div>
                                )}
                                {appliedDiscount && (
                                    <div style={{ fontSize: 13, marginTop: 8, paddingTop: appliedFreeship ? 0 : 12, borderTop: appliedFreeship ? "none" : "1px solid rgba(79, 70, 229, 0.1)", color: "var(--primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>Discount: <b>{appliedDiscount.code}</b></span>
                                        <button style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 600 }} onClick={() => setAppliedDiscount(null)}>Bỏ chọn</button>
                                    </div>
                                )}
                            </div>

                            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Chi tiết thanh toán</h3>
                            <div className="sumRow" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 15 }}>
                                <span style={{ color: "var(--text-light)" }}>Tổng tiền hàng</span>
                                <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
                            </div>
                            <div className="sumRow" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 15 }}>
                                <span style={{ color: "var(--text-light)" }}>Phí vận chuyển</span>
                                <span style={{ fontWeight: 600, color: shippingFee === 0 ? "#10b981" : "var(--text)" }}>{shippingFee === 0 ? "FREE" : fmt(shippingFee)}</span>
                            </div>

                            {appliedFreeship && freeshipAmount > 0 && (
                                <div className="sumRow" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 15, color: "#10b981", fontWeight: 600 }}>
                                    <span>Voucher Vận Chuyển</span>
                                    <span>-{fmt(freeshipAmount)}</span>
                                </div>
                            )}
                            {appliedDiscount && discountAmount > 0 && (
                                <div className="sumRow" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 15, color: "#10b981", fontWeight: 600 }}>
                                    <span>Voucher Giảm Giá</span>
                                    <span>-{fmt(discountAmount)}</span>
                                </div>
                            )}

                            <div style={{ height: 1, background: "var(--line)", margin: "24px 0" }} />
                            <div className="sumRow sumTotal" style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                                <span style={{ fontWeight: 800, fontSize: 18 }}>Tổng thanh toán</span>
                                <span style={{ fontWeight: 800, fontSize: 24, color: "var(--primary)" }}>{fmt(total)}</span>
                            </div>
                            <button
                                className="btn btn-primary sumBtn"
                                onClick={handlePlaceOrder}
                                disabled={placing || items.length === 0}
                                style={{ width: "100%", padding: 18, borderRadius: 16, fontSize: 16, fontWeight: 700 }}
                            >
                                {placing ? "Đang xử lý..." : "Đặt hàng"}
                            </button>
                            <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--text-lighter)" }}>
                                By placing an order, you agree to our Terms & Privacy.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ShopeeFooter />

            {/* VOUCHER MODAL */}
            {showVoucherModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="card" style={{ width: 480, maxWidth: "90%", padding: 32, borderRadius: 24, position: "relative", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
                        <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Select Voucher</h3>
                        <p style={{ color: "var(--text-light)", marginBottom: 24, fontSize: 14 }}>Enter a code or choose from your saved vouchers.</p>
                        <button style={{ position: "absolute", top: 24, right: 24, background: "#f1f5f9", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-light)", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setShowVoucherModal(false); setCouponMessage(""); }}>×</button>

                        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                            <input
                                type="text"
                                className="formControl"
                                placeholder="Voucher Code (e.g. WELCOME50)"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                style={{ flex: 1, borderRadius: 12, padding: "12px 16px" }}
                            />
                            <button className="btn btn-primary" style={{ padding: "0 24px", borderRadius: 12, fontWeight: 700 }} onClick={handleApplyTextVoucher}>Apply</button>
                        </div>
                        {couponMessage && <div style={{ fontSize: 13, color: couponMessage.includes("success") ? "#10b981" : "var(--accent)", marginBottom: 24, marginTop: -12, fontWeight: 600 }}>{couponMessage}</div>}

                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 24, paddingRight: 8 }}>
                            {/* SHIPPING VOUCHERS */}
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Free Delivery Vouchers</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {availableVouchers.filter(x => x.type === "shipping" && savedVoucherCodes.includes(x.code)).map(v => {
                                        const disabled = subtotal < v.minOrder || (v.type === "shipping" && shippingFee === 0);
                                        return (
                                            <div key={v.code} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, border: appliedFreeship?.code === v.code ? "2px solid var(--primary)" : "2px solid var(--line)", borderRadius: 16, background: appliedFreeship?.code === v.code ? "var(--primary-light)" : "white", opacity: disabled ? 0.5 : 1 }}>
                                                <div style={{ width: 56, height: 56, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, fontSize: 18 }}>
                                                    🚚
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{v.title}</div>
                                                    <div style={{ fontSize: 12, color: "var(--text-light)" }}>{v.desc}</div>
                                                    {disabled && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4, fontWeight: 600 }}>Not applicable</div>}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="voucherFreeship"
                                                    disabled={disabled}
                                                    checked={appliedFreeship?.code === v.code}
                                                    onChange={() => handleSelectFreeship(v)}
                                                    style={{ width: 18, height: 18, cursor: disabled ? "not-allowed" : "pointer" }}
                                                />
                                            </div>
                                        );
                                    })}
                                    {availableVouchers.filter(x => x.type === "shipping" && savedVoucherCodes.includes(x.code)).length === 0 && (
                                        <div style={{ fontSize: 13, color: "var(--text-lighter)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No saved shipping vouchers found.</div>
                                    )}
                                </div>
                            </div>

                            {/* DISCOUNT VOUCHERS */}
                            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 24 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Discount Vouchers</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {availableVouchers.filter(x => x.type === "discount" && savedVoucherCodes.includes(x.code)).map(v => {
                                        const disabled = subtotal < v.minOrder;
                                        return (
                                            <div key={v.code} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, border: appliedDiscount?.code === v.code ? "2px solid var(--primary)" : "2px solid var(--line)", borderRadius: 16, background: appliedDiscount?.code === v.code ? "var(--primary-light)" : "white", opacity: disabled ? 0.5 : 1 }}>
                                                <div style={{ width: 56, height: 56, background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, fontSize: 18 }}>
                                                    ✨
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{v.title}</div>
                                                    <div style={{ fontSize: 12, color: "var(--text-light)" }}>{v.desc}</div>
                                                    {disabled && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4, fontWeight: 600 }}>Min. order {fmt(v.minOrder)}</div>}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="voucherDiscount"
                                                    disabled={disabled}
                                                    checked={appliedDiscount?.code === v.code}
                                                    onChange={() => handleSelectDiscount(v)}
                                                    style={{ width: 18, height: 18, cursor: disabled ? "not-allowed" : "pointer" }}
                                                />
                                            </div>
                                        );
                                    })}
                                    {availableVouchers.filter(x => x.type === "discount" && savedVoucherCodes.includes(x.code)).length === 0 && (
                                        <div style={{ fontSize: 13, color: "var(--text-lighter)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No saved discount vouchers found.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-primary" style={{ width: "100%", marginTop: 32, padding: 16, borderRadius: 16, fontWeight: 700 }} onClick={() => setShowVoucherModal(false)}>Apply Voucher</button>
                    </div>
                </div>
            )}
        </div>
    );
}
