import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaMoneyBillWave, FaClipboardList, FaBox, FaWarehouse, FaArrowUp, FaArrowDown } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function SellerDashboard() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        axiosClient.get("/api/seller/analytics")
            .then(res => setData(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user]);

    const stats = [
        { icon: <FaMoneyBillWave />, label: "Doanh thu", val: fmt(data?.totalRevenue), color: "var(--as-success)", bg: "rgba(16, 185, 129, 0.1)" },
        { icon: <FaClipboardList />, label: "Tổng đơn hàng", val: data?.totalOrders ?? 0, color: "var(--as-info)", bg: "rgba(59, 130, 246, 0.1)" },
        { icon: <FaBox />, label: "Sản phẩm", val: data?.totalProducts ?? 0, color: "var(--as-primary)", bg: "rgba(79, 70, 229, 0.1)" },
        { icon: <FaWarehouse />, label: "Tồn kho", val: data?.totalStockRemaining ?? 0, color: "var(--as-warning)", bg: "rgba(245, 158, 11, 0.1)" },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingTop: 10 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Tổng quan Shop</h1>
            </div>

            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
                    {[0, 1, 2, 3].map(i => <div key={i} className="as-card"><div style={{ height: 100, background: "rgba(0,0,0,0.05)", borderRadius: 12 }} /></div>)}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
                    {stats.map(s => (
                        <div key={s.label} className="as-card" style={{ display: "flex", alignItems: "center", gap: 20, padding: 24 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                                {s.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--as-text)", marginBottom: 4 }}>{s.val}</div>
                                <div style={{ fontSize: "0.9rem", color: "var(--as-text-muted)", fontWeight: 500 }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Top products */}
                <div className="as-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8, color: "var(--as-text)" }}>
                        <FaArrowUp style={{ color: "var(--as-success)" }} /> Sản phẩm bán chạy
                    </h3>
                    {loading ? <div style={{ padding: 20, textAlign: "center" }}>Đang tải...</div> : (
                        <div className="as-table-wrapper" style={{ margin: 0 }}>
                            <table className="as-table">
                                <thead><tr><th>Sản phẩm</th><th>Đã bán</th><th>Giá</th></tr></thead>
                                <tbody>
                                    {data?.topProducts?.length ? data.topProducts.map(p => (
                                        <tr key={p._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/seller/products/${p._id}/edit`)}>
                                            <td>
                                                <div style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{p.name}</div>
                                            </td>
                                            <td style={{ color: "var(--as-success)", fontWeight: 700 }}>{p.sold}</td>
                                            <td style={{ color: "var(--as-primary)", fontWeight: 600 }}>{fmt(p.price)}</td>
                                        </tr>
                                    )) : <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--as-text-muted)", padding: 40 }}>Chưa có dữ liệu</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Slow products */}
                <div className="as-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8, color: "var(--as-text)" }}>
                        <FaArrowDown style={{ color: "var(--as-danger)" }} /> Sản phẩm bán chậm (Tồn nhiều)
                    </h3>
                    {loading ? <div style={{ padding: 20, textAlign: "center" }}>Đang tải...</div> : (
                        <div className="as-table-wrapper" style={{ margin: 0 }}>
                            <table className="as-table">
                                <thead><tr><th>Sản phẩm</th><th>Đã bán</th><th>Tồn kho</th></tr></thead>
                                <tbody>
                                    {data?.slowProducts?.length ? data.slowProducts.map(p => (
                                        <tr key={p._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/seller/products/${p._id}/edit`)}>
                                            <td>
                                                <div style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{p.name}</div>
                                            </td>
                                            <td style={{ color: "var(--as-danger)", fontWeight: 700 }}>{p.sold}</td>
                                            <td style={{ fontWeight: 600 }}>{p.stock}</td>
                                        </tr>
                                    )) : <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--as-text-muted)", padding: 40 }}>Chưa có dữ liệu</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
