import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getNotifications, markNotifRead, markAllNotifsRead, deleteNotif } from "../api/userApi";
import { FaBell, FaTrash } from "react-icons/fa";

export default function NotificationDropdown() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [unread, setUnread] = useState(0);
    const dropRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!user) return;
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const fetchNotifs = async () => {
        if (!user) return;
        try {
            const res = await getNotifications({ limit: 10 });
            setNotifs(res.data.notifications || []);
            setUnread(res.data.unreadCount || 0);
        } catch { }
    };

    const handleOpen = () => {
        setOpen(prev => !prev);
        if (!open) fetchNotifs();
    };

    const handleRead = async (notif) => {
        if (!notif.isRead) {
            try {
                await markNotifRead(notif._id);
                setNotifs(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
                setUnread(prev => Math.max(0, prev - 1));
            } catch { }
        }
        if (notif.link) {
            setOpen(false);
            navigate(notif.link);
        }
    };

    const handleReadAll = async () => {
        try {
            await markAllNotifsRead();
            setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnread(0);
        } catch { }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteNotif(id);
            setNotifs(prev => {
                const removed = prev.find(n => n._id === id);
                if (removed && !removed.isRead) setUnread(u => Math.max(0, u - 1));
                return prev.filter(n => n._id !== id);
            });
        } catch { }
    };

    const timeAgo = (dateStr) => {
        const diff = (Date.now() - new Date(dateStr)) / 1000;
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    if (!user) return null;

    return (
        <div ref={dropRef} style={{ position: "relative" }}>
            <button
                onClick={handleOpen}
                style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#fff", position: "relative", padding: "4px 8px",
                    display: "flex", alignItems: "center"
                }}
                title="Notifications"
            >
                <FaBell size={20} />
                {unread > 0 && (
                    <span style={{
                        position: "absolute", top: -2, right: -2,
                        background: "var(--accent)", color: "#fff", borderRadius: "50%",
                        fontSize: 10, fontWeight: 700, minWidth: 17, height: 17,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 3px", border: "2px solid #4f46e5"
                    }}>{unread > 99 ? "99+" : unread}</span>
                )}
            </button>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 12px)", right: 0,
                    width: 360, background: "#fff", borderRadius: 16,
                    boxShadow: "var(--shadow-lg)", zIndex: 9999,
                    overflow: "hidden"
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "16px 20px", borderBottom: "1px solid var(--line)",
                        display: "flex", alignItems: "center", justifyContent: "space-between"
                    }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>Notifications</span>
                        {unread > 0 && (
                            <button
                                onClick={handleReadAll}
                                style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div style={{ maxHeight: 400, overflowY: "auto" }}>
                        {notifs.length === 0 ? (
                            <div style={{ padding: "48px 32px", textAlign: "center", color: "var(--text-light)" }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                                <div style={{ fontWeight: 600 }}>All caught up!</div>
                                <div style={{ fontSize: 13 }}>No new notifications for you right now.</div>
                            </div>
                        ) : notifs.map(n => (
                            <div
                                key={n._id}
                                onClick={() => handleRead(n)}
                                style={{
                                    padding: "16px 20px", cursor: "pointer",
                                    background: n.isRead ? "#fff" : "var(--primary-light)",
                                    borderBottom: "1px solid var(--line)",
                                    display: "flex", gap: 16, alignItems: "flex-start",
                                    transition: "all 0.2s"
                                }}
                            >
                                {/* Icon based on type */}
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: n.isRead ? "#f1f5f9" : "rgba(79, 70, 229, 0.1)",
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                                }}>
                                    {n.type === "order_placed" ? "🎉"
                                        : n.type === "order_confirmed" ? "✅"
                                            : n.type === "order_shipping" ? "🚚"
                                                : n.type === "order_delivered" ? "📦"
                                                    : n.type === "order_cancelled" ? "❌"
                                                        : "🔔"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: n.isRead ? 600 : 800, fontSize: 14, marginBottom: 4, color: "var(--text)" }}>
                                        {n.title}
                                    </div>
                                    <div style={{ fontSize: 13, color: "var(--text-light)", lineHeight: 1.5 }}>{n.message}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-lighter)", marginTop: 6, fontWeight: 500 }}>{timeAgo(n.createdAt)}</div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, n._id)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", flexShrink: 0, padding: 4 }}
                                    title="Delete"
                                >
                                    <FaTrash size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
