import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaCommentDots } from "react-icons/fa";
import axiosClient from "../api/axiosClient";
import socket from "../utils/socket";

export default function MessageIcon() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!user) return;
        
        socket.emit("join", user._id);
        
        // Fetch unread count initially
        const fetchUnread = async () => {
            try {
                const res = await axiosClient.get("/api/chat/unread");
                setUnread(res.data.unreadCount || 0);
            } catch (err) {}
        };
        fetchUnread();
        
        // Listen for new messages via socket
        const handleNewMessage = (msg) => {
            if (msg.receiver === user._id) {
                setUnread(prev => prev + 1);
            }
        };
        
        socket.on("new_message", handleNewMessage);
        
        const handleChatRead = () => fetchUnread();
        window.addEventListener("chat_read", handleChatRead);
        socket.on("messages_read", handleChatRead);
        
        return () => {
            socket.off("new_message", handleNewMessage);
            socket.off("messages_read", handleChatRead);
            window.removeEventListener("chat_read", handleChatRead);
        };
    }, [user]);

    const handleClick = () => {
        // Go to messages page based on role. 
        // We assume buyer if not seller. Wait, sellers can also be buyers, but we'll prioritize their main dashboard.
        if (user?.role === "seller") {
            navigate("/seller/messages");
        } else if (user?.role === "admin") {
            // If admin has messages, could go to admin messages, but let's assume they use buyer interface for now.
            navigate("/buyer/messages");
        } else {
            navigate("/buyer/messages");
        }
    };

    if (!user) return null;

    return (
        <button
            onClick={handleClick}
            style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#fff", position: "relative", padding: "4px 8px",
                display: "flex", alignItems: "center"
            }}
            title="Messages"
        >
            <FaCommentDots size={20} />
            {unread > 0 && (
                <span style={{
                    position: "absolute", top: -2, right: -2,
                    background: "var(--accent)", color: "#fff", borderRadius: "50%",
                    fontSize: 10, fontWeight: 700, minWidth: 17, height: 17,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px", border: "2px solid #4f46e5"
                }}>{unread > 9 ? "9+" : unread}</span>
            )}
        </button>
    );
}
