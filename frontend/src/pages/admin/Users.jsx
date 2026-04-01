import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaUnlock, FaTrash } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

export default function AdminUsers() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== "admin") return navigate("/");
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
        } catch (err) {
            alert("Thao tác thất bại.");
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 className="as-page-title" style={{ marginBottom: 0 }}>Quản lý Người dùng</h1>
                <div style={{ color: "var(--as-text-muted)", fontWeight: 500 }}>
                    Tổng cộng: <span style={{ color: "var(--as-primary)", fontSize: "1.1rem" }}>{users.length}</span> tài khoản
                </div>
            </div>

            <div className="as-table-wrapper">
                {loading ? <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div> : (
                    <table className="as-table">
                        <thead>
                            <tr>
                                <th>Tên người dùng</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Ngày tham gia</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: "right" }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                                    </td>
                                    <td style={{ color: "var(--as-text-muted)" }}>{u.email}</td>
                                    <td>
                                        <span className={`as-badge ${u.role === "admin" ? "as-badge-info" : u.role === "seller" ? "as-badge-success" : "as-badge-neutral"}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: "0.85rem", color: "var(--as-text-muted)" }}>
                                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td>
                                        <span className={`as-badge ${u.isBlocked ? "as-badge-danger" : "as-badge-success"}`}>
                                            {u.isBlocked ? "Bị khóa" : "Hoạt động"}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {u.role !== "admin" && (
                                            <button
                                                className={`as-btn ${u.isBlocked ? "as-btn-primary" : "as-btn-outline"}`}
                                                onClick={() => toggleBlock(u)}
                                                title={u.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
                                                style={{ padding: "8px 12px" }}
                                            >
                                                {u.isBlocked ? <FaUnlock /> : <FaLock />}
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
