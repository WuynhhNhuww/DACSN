import { useState, useEffect, useContext, useRef } from "react";
import { FaPaperPlane, FaUser, FaStore } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import socket from "../../utils/socket";

export default function BuyerMessages() {
    const { user } = useContext(AuthContext);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // The user we are chatting with
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState("");
    const [loadingConvos, setLoadingConvos] = useState(true);
    const messagesEndRef = useRef(null);

    // Fetch conversations list exactly once when component mounts
    useEffect(() => {
        if (!user) return;
        const fetchConversations = async () => {
            try {
                const res = await axiosClient.get("/api/chat/conversations");
                setConversations(res.data);
            } catch (err) {
                console.error("Lỗi lấy danh sách nhắn tin:", err);
            } finally {
                setLoadingConvos(false);
            }
        };
        fetchConversations();
    }, [user]);

    // Socket connection
    useEffect(() => {
        if (user) {
            socket.emit("join", user._id);

            const handleNewMessage = (msg) => {
                // Update messages if this message belongs to active chat
                if (activeChat && (msg.sender === activeChat._id || msg.receiver === activeChat._id)) {
                    setMessages(prev => {
                        if (prev.some(m => m._id === msg._id)) return prev;
                        return [...prev, msg];
                    });
                    
                    // If we receive a message in the active chat, mark it as read immediately
                    if (msg.receiver === user._id) {
                        axiosClient.patch(`/api/chat/${activeChat._id}/read`).then(() => {
                            window.dispatchEvent(new Event("chat_read"));
                        }).catch(console.error);
                    }
                }
                
                // Refresh conversations list to show last message and update unread count
                axiosClient.get("/api/chat/conversations")
                    .then(res => setConversations(res.data))
                    .catch(console.error);
            };

            socket.on("new_message", handleNewMessage);
            return () => socket.off("new_message", handleNewMessage);
        }
    }, [user, activeChat]);

    // Fetch messages for active chat
    useEffect(() => {
        if (activeChat) {
            axiosClient.get(`/api/chat/${activeChat._id}`)
                .then(res => {
                    setMessages(res.data);
                    // Mark as read when opening
                    return axiosClient.patch(`/api/chat/${activeChat._id}/read`);
                })
                .then(() => {
                    window.dispatchEvent(new Event("chat_read"));
                    // Update unread count in conversations list
                    setConversations(prev => prev.map(c => 
                        c.user._id === activeChat._id ? { ...c, unreadCount: 0 } : c
                    ));
                })
                .catch(err => console.error("Lỗi lấy tin nhắn:", err));
        }
    }, [activeChat]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || !activeChat) return;

        const optimisticMsg = {
            _id: Date.now().toString(),
            sender: user._id,
            receiver: activeChat._id,
            text: inputMsg,
            createdAt: new Date().toISOString(),
            read: false
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInputMsg("");

        try {
            await axiosClient.post("/api/chat", { receiverId: activeChat._id, text: optimisticMsg.text });
            // Re-fetch next tick
            axiosClient.get("/api/chat/conversations")
                .then(res => setConversations(res.data))
                .catch(console.error);
        } catch (err) {
            alert("Lỗi gửi tin nhắn");
        }
    };

    return (
        <div className="container" style={{ padding: "20px 0" }}>
            <div style={{ display: "flex", height: "calc(100vh - 160px)", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)", border: "1px solid var(--line)" }}>

                {/* Left: Coversations List */}
                <div style={{ width: 320, background: "#f8fafc", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: 20, borderBottom: "1px solid var(--line)", background: "#fff" }}>
                        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Tin nhắn của tôi</h2>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {loadingConvos ? (
                            <div style={{ padding: 20, textAlign: "center", color: "var(--text-light)" }}>Đang tải...</div>
                        ) : conversations.length === 0 ? (
                            <div style={{ padding: 20, textAlign: "center", color: "var(--text-light)", fontSize: "0.9rem" }}>Chưa có cuộc trò chuyện nào.</div>
                        ) : (
                            conversations.map(c => (
                                <div
                                    key={c.user._id}
                                    onClick={() => setActiveChat(c.user)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "16px 20px",
                                        cursor: "pointer",
                                        borderBottom: "1px solid var(--line)",
                                        background: activeChat?._id === c.user._id ? "rgba(79, 70, 229, 0.05)" : "transparent",
                                        transition: "background 0.2s"
                                    }}
                                >
                                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                                        <FaStore />
                                    </div>
                                    <div style={{ overflow: "hidden", flex: 1 }}>
                                        <div style={{ fontWeight: (c.unreadCount > 0) ? 700 : 600, fontSize: "0.95rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {c.user.shopName || c.user.name}
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: (c.unreadCount > 0) ? "var(--text)" : "var(--text-light)", fontWeight: (c.unreadCount > 0) ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 4 }}>
                                            {c.lastMessage}
                                        </div>
                                    </div>
                                    {c.unreadCount > 0 && (
                                        <div style={{
                                            background: "var(--accent)", color: "#fff", borderRadius: "50%",
                                            fontSize: 10, fontWeight: 700, minWidth: 20, height: 20,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            padding: "0 4px"
                                        }}>
                                            {c.unreadCount > 9 ? "9+" : c.unreadCount}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Chat Window */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
                    {activeChat ? (
                        <>
                            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", zIndex: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                                    <FaStore />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{activeChat.shopName || activeChat.name}</div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>Cửa hàng</div>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 16 }}>
                                {messages.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "var(--text-light)", marginTop: "auto", marginBottom: "auto" }}>
                                        Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên!
                                    </div>
                                ) : (
                                    messages.map(msg => {
                                        const isMe = msg.sender === user._id;
                                        return (
                                            <div key={msg._id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "60%" }}>
                                                <div style={{
                                                    background: isMe ? "var(--primary)" : "#fff",
                                                    color: isMe ? "#fff" : "var(--text)",
                                                    padding: "12px 16px",
                                                    borderRadius: 16,
                                                    borderBottomRightRadius: isMe ? 4 : 16,
                                                    borderBottomLeftRadius: isMe ? 16 : 4,
                                                    boxShadow: "var(--shadow-sm)",
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1.5,
                                                    border: isMe ? "none" : "1px solid var(--line)"
                                                }}>
                                                    {msg.text}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: 6, textAlign: isMe ? "right" : "left", padding: "0 4px" }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={{ padding: 16, background: "#fff", borderTop: "1px solid var(--line)" }}>
                                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 12 }}>
                                    <input
                                        type="text"
                                        placeholder="Nhập tin nhắn..."
                                        style={{ flex: 1, borderRadius: 24, padding: "12px 20px", border: "1px solid var(--line)", outline: "none", fontSize: "0.95rem" }}
                                        value={inputMsg}
                                        onChange={e => setInputMsg(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputMsg.trim()}
                                        style={{ width: 48, height: 48, borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", background: inputMsg.trim() ? "var(--primary)" : "#e2e8f0", color: "#fff", border: "none", cursor: inputMsg.trim() ? "pointer" : "not-allowed" }}
                                    >
                                        <FaPaperPlane />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-light)" }}>
                            <FaStore size={64} style={{ color: "var(--line)", marginBottom: 20 }} />
                            <h3 style={{ margin: 0, fontWeight: 600 }}>Cửa sổ Chat</h3>
                            <p style={{ marginTop: 8 }}>Chọn một cửa hàng bên trái để bắt đầu nhắn tin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
