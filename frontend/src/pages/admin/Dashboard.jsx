import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUsers, FaStore, FaShoppingCart, FaCoins,
    FaExclamationTriangle, FaTags, FaBullhorn,
    FaChartLine, FaArrowUp, FaArrowDown, FaCheckCircle
} from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: "#0f172a", color: "#f8fafc", padding: "12px 16px",
                borderRadius: 12, fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.3)"
            }}>
                <div style={{ color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "#818cf8" }}>
                    {fmt(payload[0].value)}
                </div>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== "admin") return navigate("/home");
        axiosClient.get("/api/admin/stats")
            .then(res => setStats(res.data))
            .catch(err => console.error("Lỗi lấy thống kê", err))
            .finally(() => setLoading(false));
    }, [user, navigate]);

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 14, color: "var(--as-text-muted)" }}>
            <div className="as-spinner" />
            <span style={{ fontWeight: 500 }}>Đang tải dữ liệu...</span>
        </div>
    );
    if (!stats) return null;

    return (
        <div>
            {/* Stat Row 1 */}
            <div className="as-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
                <div className="as-card as-stat-card clickable" onClick={() => navigate("/admin/users")}>
                    <div className="as-stat-icon as-stat-icon-primary"><FaUsers /></div>
                    <div className="as-stat-info">
                        <div className="as-stat-label">Tổng Người mua</div>
                        <div className="as-stat-value">{stats.buyers?.total || 0}</div>
                        <div className="as-stat-sub">{stats.buyers?.blocked || 0} tài khoản bị khóa</div>
                    </div>
                </div>

                <div className="as-card as-stat-card clickable" onClick={() => navigate("/admin/sellers")}>
                    <div className="as-stat-icon as-stat-icon-success"><FaStore /></div>
                    <div className="as-stat-info">
                        <div className="as-stat-label">Gian hàng</div>
                        <div className="as-stat-value">{stats.sellers?.total || 0}</div>
                        <div className="as-stat-sub">
                            <span style={{ color: "var(--as-success-dark)", fontWeight: 600 }}>{stats.sellers?.active || 0} hoạt động</span>
                            {" · "}
                            <span style={{ color: "var(--as-warning)", fontWeight: 600 }}>{stats.sellers?.pending || 0} chờ duyệt</span>
                        </div>
                    </div>
                </div>

                <div className="as-card as-stat-card">
                    <div className="as-stat-icon as-stat-icon-warning"><FaShoppingCart /></div>
                    <div className="as-stat-info">
                        <div className="as-stat-label">Tổng đơn hàng</div>
                        <div className="as-stat-value">{stats.orders?.total || 0}</div>
                        <div className="as-stat-sub">{stats.orders?.completed || 0} hoàn thành</div>
                    </div>
                </div>

                <div className="as-card as-stat-card">
                    <div className="as-stat-icon" style={{ background: "#fce7f3", color: "#be185d" }}><FaCoins /></div>
                    <div className="as-stat-info">
                        <div className="as-flex-between as-mb-4">
                            <span className="as-stat-label">Doanh thu</span>
                            {stats?.revenueGrowth != null && (
                                <span className={`as-stat-growth ${stats.revenueGrowth >= 0 ? "up" : "down"}`}>
                                    {stats.revenueGrowth >= 0 ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
                                    {Math.abs(stats.revenueGrowth)}%
                                </span>
                            )}
                        </div>
                        <div className="as-stat-value" style={{ fontSize: "1.45rem", color: "#be185d" }}>{fmt(stats.totalRevenue)}</div>
                        <div className="as-stat-sub">Đã giao & Hoàn thành</div>
                    </div>
                </div>
            </div>

            {/* Stat Row 2 */}
            <div className="as-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 24 }}>
                <div className="as-card as-stat-card">
                    <div className="as-stat-icon as-stat-icon-danger"><FaArrowDown /></div>
                    <div className="as-stat-info">
                        <div className="as-stat-label">Tỷ lệ Hoàn / Hủy</div>
                        <div className="as-stat-value" style={{ color: "var(--as-danger-dark)" }}>{stats.orders?.returnRate || 0}%</div>
                    </div>
                </div>

                <div className="as-card as-stat-card clickable" onClick={() => navigate("/admin/complaints")}>
                    <div className="as-stat-icon as-stat-icon-warning"><FaExclamationTriangle /></div>
                    <div className="as-stat-info">
                        <div className="as-stat-label">Khiếu nại cần xử lý</div>
                        <div className="as-stat-value">{stats.complaints?.open || 0}</div>
                        <div className="as-stat-sub">/ {stats.complaints?.total || 0} tổng</div>
                    </div>
                </div>

                <div className="as-card as-stat-card clickable" onClick={() => navigate("/admin/banners")}>
                    <div className="as-stat-icon as-stat-icon-info"><FaBullhorn /></div>
                    <div className="as-stat-info">
                        <div className="as-stat-label">Banner Quảng cáo</div>
                        <div className="as-stat-value">{stats.banners?.active || 0}</div>
                        <div className="as-stat-sub">{stats.banners?.pending || 0} chờ duyệt</div>
                    </div>
                </div>

                <div className="as-card as-stat-card clickable" onClick={() => navigate("/admin/products")}>
                    <div className="as-stat-icon as-stat-icon-orange"><FaTags /></div>
                    <div className="as-stat-info">
                        <div className="as-stat-label">Sản phẩm đã duyệt</div>
                        <div className="as-stat-value">{stats.products?.approved || 0}</div>
                        <div className="as-stat-sub"><span style={{ color: "var(--as-warning)", fontWeight: 600 }}>{stats.products?.pending || 0} chờ duyệt</span></div>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            {stats?.monthlyRevenue && (
                <div className="as-chart-wrapper">
                    <div className="as-chart-header">
                        <FaChartLine style={{ color: "var(--as-primary)", fontSize: "1.1rem" }} />
                        <span className="as-chart-title">Tăng trưởng Doanh thu Toàn sàn — 6 tháng gần nhất</span>
                    </div>
                    <div style={{ width: "100%", height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyRevenue} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#6366f1", strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Top Products Table */}
            <div className="as-card-flat">
                <div className="as-flex-center as-gap-8 as-mb-16">
                    <FaCheckCircle style={{ color: "var(--as-primary)", fontSize: "1.05rem" }} />
                    <h3 className="as-section-title" style={{ marginBottom: 0 }}>Sản phẩm bán chạy nhất</h3>
                </div>
                <div className="as-table-wrapper">
                    {!stats.topProducts?.length ? (
                        <div className="as-table-empty">Chưa có dữ liệu bán hàng</div>
                    ) : (
                        <table className="as-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 48 }}>#</th>
                                    <th>Sản phẩm</th>
                                    <th>Giá</th>
                                    <th className="as-text-right">Đã bán</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topProducts?.map((p, i) => (
                                    <tr key={p._id}>
                                        <td>
                                            <div className={`as-top-product-rank ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>
                                                {i + 1}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="as-product-cell">
                                                <img src={p.images?.[0] || "/placeholder.png"} className="as-product-img" alt="" />
                                                <div>
                                                    <div className="as-product-name">{p.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: "var(--as-primary)", fontSize: "0.9rem" }}>{fmt(p.price)}</span>
                                        </td>
                                        <td className="as-text-right">
                                            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{p.sold}</span>
                                            <span style={{ fontSize: "0.78rem", color: "var(--as-text-muted)", marginLeft: 4 }}>sp</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
