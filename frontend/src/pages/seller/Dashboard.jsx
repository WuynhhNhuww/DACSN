import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaMoneyBillWave, FaClipboardList, FaBox, FaWarehouse, FaArrowUp, FaArrowDown, FaChartLine } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
        { icon: <FaMoneyBillWave />, label: "Doanh thu (Đã giao & HT)", val: fmt(data?.totalRevenue), color: "var(--as-success)", bg: "rgba(16, 185, 129, 0.1)", path: "/seller/orders" },
        { icon: <FaClipboardList />, label: "Tổng đơn hàng", val: data?.totalOrders ?? 0, color: "var(--as-info)", bg: "rgba(59, 130, 246, 0.1)", path: "/seller/orders" },
        { icon: <FaArrowDown />, label: "Tỷ lệ Hoàn/Hủy", val: `${data?.returnRate || 0}%`, color: "var(--as-danger)", bg: "rgba(244, 63, 94, 0.1)", path: "/seller/orders" },
        { icon: <FaBox />, label: "Sản phẩm", val: data?.totalProducts ?? 0, color: "var(--as-primary)", bg: "rgba(79, 70, 229, 0.1)", path: "/seller/products" },
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
                        <div key={s.label} className="as-card" style={{ display: "flex", alignItems: "center", gap: 20, padding: 24, cursor: "pointer", transition: "transform 0.2s" }} onClick={() => navigate(s.path)} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                                {s.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--as-text)", marginBottom: 4 }}>{s.val}</div>
                                <div style={{ fontSize: "0.9rem", color: "var(--as-text-muted)", fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    {s.label}
                                    {s.label === "Doanh thu" && data?.revenueGrowth && (
                                        <span style={{ fontSize: "0.75rem", padding: "2px 6px", borderRadius: 4, background: data.revenueGrowth >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)", color: data.revenueGrowth >= 0 ? "var(--as-success)" : "var(--as-danger)" }}>
                                            {data.revenueGrowth >= 0 ? "▲" : "▼"} {Math.abs(data.revenueGrowth)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && data?.monthlyRevenue && (
                <div className="as-card" style={{ padding: 24, marginBottom: 32 }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8, color: "var(--as-text)" }}>
                        <FaChartLine style={{ color: "var(--as-primary)" }} /> Phân tích doanh thu (6 tháng qua)
                    </h3>
                    <div style={{ width: "100%", height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.monthlyRevenue} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 13 }} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={(val) => `₫${(val/1000000).toFixed(0)}M`} tick={{ fill: "#64748b", fontSize: 13 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    formatter={(value) => [fmt(value), "Doanh thu"]}
                                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "var(--as-shadow-lg)" }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="var(--as-primary)" strokeWidth={3} activeDot={{ r: 8, strokeWidth: 0, fill: "var(--as-primary)" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
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
