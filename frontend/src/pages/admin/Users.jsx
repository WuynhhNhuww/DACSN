import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaUnlock, FaSearch, FaUsers } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

export default function AdminUsers() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user || user.role !== "admin") return navigate("/home");
        loadUsers();
    }, [user, navigate]);

    const loadUsers = () => {
        axiosClient.get("/api/users")
            .then(res => setUsers(res.data || []))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    };

    const toggleBlock = async (u) => {
        if (u.role === "admin") return alert("Không thể khóa Admin!");
        if (!window.confirm(`Bạn muốn ${u.isBlocked ? "kích hoạt" : "khóa"} tài khoản ${u.email}?`)) return;
        try {
            await axiosClient.put(`/api/users/${u._id}/block`);
            setUsers(users.map(x => x._id === u._id ? { ...x, isBlocked: !x.isBlocked } : x));
        } catch {
            alert("Thao tác thất bại.");
        }
    };

    const filtered = users.filter(u =>
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const blocked = users.filter(u => u.isBlocked).length;

    return (
        <div>
            {/* Page Header */}
            <div className="as-page-header">
                <div className="as-page-header-left">
                    <h1 className="as-page-title">Người dùng</h1>
                    <p className="as-page-subtitle">
                        <span style={{ fontWeight: 700, color: "var(--as-primary)" }}>{users.length}</span> tài khoản ·
                        <span style={{ fontWeight: 700, color: "var(--as-danger-dark)", marginLeft: 6 }}>{blocked}</span> bị khóa
                    </p>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 20, maxWidth: 380 }}>
                <FaSearch style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    color: "var(--as-text-muted)", fontSize: "0.85rem"
                }} />
                <input
                    className="as-input"
                    style={{ paddingLeft: 40 }}
                    placeholder="Tìm kiếm tên, email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="as-table-wrapper">
                {loading ? (
                    <div className="as-table-loading"><div className="as-spinner" /><span>Đang tải dữ liệu...</span></div>
                ) : filtered.length === 0 ? (
                    <div className="as-table-empty">Không tìm thấy người dùng nào</div>
                ) : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Người dùng</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Ngày tham gia</th>
                                <th>Trạng thái</th>
                                <th className="as-text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: "50%",
                                                background: u.role === "admin"
                                                    ? "linear-gradient(135deg, #6366f1, #818cf8)"
                                                    : u.role === "seller"
                                                        ? "linear-gradient(135deg, #10b981, #059669)"
                                                        : "linear-gradient(135deg, #94a3b8, #64748b)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: "white", fontWeight: 700, fontSize: "0.82rem", flexShrink: 0
                                            }}>
                                                {u.name?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                            <span style={{ fontWeight: 600, color: "var(--as-text)" }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: "var(--as-text-muted)", fontSize: "0.875rem" }}>{u.email}</td>
                                    <td>
                                        <span className={`as-badge ${u.role === "admin" ? "as-badge-purple" : u.role === "seller" ? "as-badge-success" : "as-badge-neutral"}`}>
                                            {u.role === "admin" ? "Admin" : u.role === "seller" ? "Người bán" : "Người mua"}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: "0.82rem", color: "var(--as-text-muted)" }}>
                                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td>
                                        <span className={`as-badge ${u.isBlocked ? "as-badge-danger" : "as-badge-success"}`}>
                                            {u.isBlocked ? "Đã khóa" : "Hoạt động"}
                                        </span>
                                    </td>
                                    <td className="as-text-right">
                                        {u.role !== "admin" && (
                                            <button
                                                className={`as-btn as-btn-sm ${u.isBlocked ? "as-btn-success" : "as-btn-outline"}`}
                                                onClick={() => toggleBlock(u)}
                                                title={u.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
                                                style={{ gap: 6 }}
                                            >
                                                {u.isBlocked ? <><FaUnlock size={11} /> Mở khóa</> : <><FaLock size={11} /> Khóa</>}
                                            </button>
                                        )}
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
