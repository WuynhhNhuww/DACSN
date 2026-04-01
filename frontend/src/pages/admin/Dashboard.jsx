import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaStore, FaShoppingCart, FaCoins, FaExclamationTriangle, FaTags, FaBullhorn } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== "admin") return navigate("/");

        axiosClient.get("/api/admin/stats")
            .then(res => setStats(res.data))
            .catch(err => console.error("Lỗi lấy thống kê", err))
            .finally(() => setLoading(false));
    }, [user, navigate]);

    return (
        <div>
            <h1 className="as-page-title">Tổng quan Hệ thống</h1>

            {loading || !stats ? <div style={{ textAlign: "center", padding: 40 }}>Đang tải biểu mẫu...</div> : (
                <>
                    {/* Hàng 1: Chỉ số chính */}
                    <div className="as-grid">
                        <div className="as-card as-stat-card">
                            <div className="as-stat-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}><FaUsers /></div>
                            <div className="as-stat-info">
                                <div className="as-stat-label">Tổng người mua ({stats.buyers?.blocked} bị khóa)</div>
                                <div className="as-stat-value">{stats.buyers?.total || 0}</div>
                            </div>
                        </div>
                        <div className="as-card as-stat-card">
                            <div className="as-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><FaStore /></div>
                            <div className="as-stat-info">
                                <div className="as-stat-label">Gian hàng ({stats.sellers?.active} on, {stats.sellers?.pending} đợi)</div>
                                <div className="as-stat-value">{stats.sellers?.total || 0}</div>
                            </div>
                        </div>
                        <div className="as-card as-stat-card">
                            <div className="as-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}><FaShoppingCart /></div>
                            <div className="as-stat-info">
                                <div className="as-stat-label">Tổng đơn ({stats.orders?.completed} ht)</div>
                                <div className="as-stat-value">{stats.orders?.total || 0}</div>
                            </div>
                        </div>
                        <div className="as-card as-stat-card">
                            <div className="as-stat-icon" style={{ background: "#fee2e2", color: "#dc2626" }}><FaCoins /></div>
                            <div className="as-stat-info">
                                <div className="as-stat-label">Tổng Doanh thu sàn</div>
                                <div className="as-stat-value" style={{ color: "#dc2626" }}>{fmt(stats.totalRevenue)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Hàng 2: Vận hành & Cảnh báo */}
                    <div className="as-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
                        <div className="as-card as-stat-card">
                            <div className="as-stat-icon" style={{ background: "#fef08a", color: "#a16207" }}><FaExclamationTriangle /></div>
                            <div className="as-stat-info">
                                <div className="as-stat-label">Khiếu nại chưa đóng</div>
                                <div className="as-stat-value">{stats.complaints?.open || 0} / {stats.complaints?.total || 0}</div>
                            </div>
                        </div>
                        <div className="as-card as-stat-card">
                            <div className="as-stat-icon" style={{ background: "#e0e7ff", color: "#4338ca" }}><FaBullhorn /></div>
                            <div className="as-stat-info">
                                <div className="as-stat-label">Banner Quảng Cáo (Chờ duyệt)</div>
                                <div className="as-stat-value">{stats.banners?.active || 0} <span style={{ fontSize: "1rem", fontWeight: 500, color: "#666" }}>({stats.banners?.pending || 0} chờ)</span></div>
                            </div>
                        </div>
                        <div className="as-card as-stat-card">
                            <div className="as-stat-icon" style={{ background: "#ffedd5", color: "#ea580c" }}><FaTags /></div>
                            <div className="as-stat-info">
                                <div className="as-stat-label">Sản phẩm (Chờ duyệt)</div>
                                <div className="as-stat-value">{stats.products?.approved || 0} <span style={{ fontSize: "1rem", fontWeight: 500, color: "#666" }}>({stats.products?.pending || 0} chờ)</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Bảng Top Products */}
                    <div className="as-grid" style={{ gridTemplateColumns: "1fr" }}>
                        <div className="as-card">
                            <h3 className="as-section-title">Sản phẩm bán chạy nhất</h3>
                            <div className="as-table-wrapper">
                                {stats.topProducts?.length === 0 ? (
                                    <div style={{ padding: 20, textAlign: "center", color: "#888" }}>Chưa có dữ liệu</div>
                                ) : (
                                    <table className="as-table">
                                        <thead>
                                            <tr>
                                                <th>Sản phẩm</th>
                                                <th style={{ textAlign: "right" }}>Đã bán</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.topProducts?.map(p => (
                                                <tr key={p._id}>
                                                    <td style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                        <img src={p.images?.[0] || "/placeholder.png"} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--as-border)" }} alt="" />
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: "0.95rem", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                                                            <div style={{ fontSize: "0.85rem", color: "var(--as-primary)", fontWeight: 600 }}>{fmt(p.price)}</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: "right", fontSize: "1rem", fontWeight: 600, color: "var(--as-text)" }}>
                                                        {p.sold}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
