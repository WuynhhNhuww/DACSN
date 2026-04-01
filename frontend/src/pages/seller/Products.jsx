import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const fmt = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function SellerProducts() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        load();
    }, [user]);

    const load = () => {
        axiosClient.get("/api/products")
            .then(res => {
                const mine = (res.data || []).filter(p => p.seller === user?._id || p.seller?._id === user?._id);
                setProducts(mine);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xác nhận xóa sản phẩm?")) return;
        setDeleting(id);
        try {
            await axiosClient.delete(`/api/products/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id));
        } catch {
            alert("Xóa thất bại, vui lòng thử lại.");
        } finally {
            setDeleting(null);
        }
    };

    const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

    const statusBadge = (status) => {
        switch (status) {
            case "approved": return <span className="as-badge as-badge-success">Hiển thị</span>;
            case "pending_review": return <span className="as-badge as-badge-warning">Chờ duyệt</span>;
            case "rejected": return <span className="as-badge as-badge-danger">Từ chối</span>;
            case "removed": return <span className="as-badge as-badge-neutral" style={{ background: "#1f2937", color: "white" }}>Bị gỡ vi phạm</span>;
            default: return <span className="as-badge">{status}</span>;
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Sản phẩm của Shop</h1>
                <button className="as-btn as-btn-primary" onClick={() => navigate("/seller/products/new")}>
                    <FaPlus style={{ marginRight: 8 }} /> Thêm sản phẩm
                </button>
            </div>

            <div className="as-card" style={{ padding: 24, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600, color: "var(--as-text)", fontSize: "1.05rem" }}>
                    Tổng cộng: <span style={{ color: "var(--as-primary)" }}>{filtered.length}</span> sản phẩm
                </div>
                <div style={{ position: "relative", width: 300 }}>
                    <FaSearch style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--as-text-muted)" }} />
                    <input
                        style={{ width: "100%", padding: "10px 16px 10px 44px", borderRadius: 20, border: "1px solid var(--as-border)", outline: "none", fontSize: "0.95rem", background: "rgba(0,0,0,0.02)" }}
                        placeholder="Tìm kiếm sản phẩm..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", background: "white", borderRadius: 16 }}>
                        <div style={{ fontSize: "3rem", marginBottom: 16 }}>📦</div>
                        <h3 style={{ margin: "0 0 16px 0", color: "var(--as-text)" }}>Chưa có sản phẩm nào</h3>
                        <button className="as-btn as-btn-primary" onClick={() => navigate("/seller/products/new")}>Tạo sản phẩm đầu tiên</button>
                    </div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Danh mục</th>
                                <th>Giá bán</th>
                                <th>Kho</th>
                                <th>Đã bán</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p._id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <div style={{ width: 56, height: 56, borderRadius: 8, background: "rgba(0,0,0,0.02)", overflow: "hidden", flexShrink: 0, border: "1px solid var(--as-border)" }}>
                                                {p.images?.[0] ? (
                                                    <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "0.8rem", color: "var(--as-text-muted)" }}>No img</div>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4, color: "var(--as-text)" }}>
                                                {p.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: "var(--as-text-muted)", fontSize: "0.95rem" }}>{p.category}</td>
                                    <td style={{ color: "var(--as-primary)", fontWeight: 700, fontSize: "1.05rem" }}>{fmt(p.price)}</td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: p.stock < 10 ? "var(--as-danger)" : "var(--as-text)", background: p.stock < 10 ? "rgba(239, 68, 68, 0.1)" : "transparent", padding: p.stock < 10 ? "2px 8px" : 0, borderRadius: 12 }}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{p.sold || 0}</td>
                                    <td>
                                        {statusBadge(p.status)}
                                        {(p.status === "rejected" || p.status === "removed") && p.rejectedReason && (
                                            <div style={{ fontSize: "0.8rem", color: "var(--as-danger)", marginTop: 6, maxWidth: 180, lineHeight: 1.4, background: "rgba(239, 68, 68, 0.05)", padding: 6, borderRadius: 6 }}>
                                                <strong>Lý do:</strong> {p.rejectedReason}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                className="as-btn as-btn-outline"
                                                style={{ padding: 8, borderColor: "var(--as-primary)", color: "var(--as-primary)" }}
                                                onClick={() => navigate(`/seller/products/${p._id}/edit`)}
                                                title="Sửa"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="as-btn as-btn-outline"
                                                style={{ padding: 8, borderColor: "var(--as-danger)", color: "var(--as-danger)" }}
                                                onClick={() => handleDelete(p._id)}
                                                disabled={deleting === p._id}
                                                title="Xóa"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
