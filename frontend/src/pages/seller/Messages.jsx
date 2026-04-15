import { useState, useEffect, useContext, useRef } from "react";
import { FaPaperPlane, FaUser, FaStore } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";

export default function SellerMessages() {
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

        // Polling conversations list every 10s to see new customers
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [user]);

    // Fetch messages for active chat
    useEffect(() => {
        let interval;
        if (activeChat) {
            const fetchMsg = async () => {
                try {
                    const res = await axiosClient.get(`/api/chat/${activeChat._id}`);
                    setMessages(res.data);
                } catch (err) { }
            };
            fetchMsg();
            interval = setInterval(fetchMsg, 3000); // Polling fast for messages
        }
        return () => clearInterval(interval);
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
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInputMsg("");

        try {
            await axiosClient.post("/api/chat", { receiverId: activeChat._id, text: optimisticMsg.text });
            // Re-fetch next tick
        } catch (err) {
            alert("Lỗi gửi tin nhắn");
        }
    };

    return (
        <div style={{ display: "flex", height: "calc(100vh - 100px)", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "var(--as-shadow-sm)", border: "1px solid var(--as-border)" }}>

            {/* Left: Coversations List */}
            <div style={{ width: 320, background: "#f8fafc", borderRight: "1px solid var(--as-border)", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: 20, borderBottom: "1px solid var(--as-border)", background: "#fff" }}>
                    <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Tin nhắn của Shop</h2>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                    {loadingConvos ? (
                        <div style={{ padding: 20, textAlign: "center", color: "var(--as-text-muted)" }}>Đang tải...</div>
                    ) : conversations.length === 0 ? (
                        <div style={{ padding: 20, textAlign: "center", color: "var(--as-text-muted)", fontSize: "0.9rem" }}>Chưa có cuộc trò chuyện nào.</div>
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
                                    borderBottom: "1px solid var(--as-border)",
                                    background: activeChat?._id === c.user._id ? "rgba(79, 70, 229, 0.05)" : "transparent",
                                    transition: "background 0.2s"
                                }}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--as-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                                    <FaUser />
                                </div>
                                <div style={{ overflow: "hidden" }}>
                                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--as-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {c.user.name}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--as-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 4 }}>
                                        {c.lastMessage}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right: Chat Window */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
                {activeChat ? (
                    <>
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--as-border)", display: "flex", alignItems: "center", gap: 12, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", zIndex: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--as-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                                <FaUser />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{activeChat.name}</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--as-text-muted)" }}>Khách hàng</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 16 }}>
                            {messages.length === 0 ? (
                                <div style={{ textAlign: "center", color: "var(--as-text-muted)", marginTop: "auto", marginBottom: "auto" }}>
                                    Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên!
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.sender === user._id;
                                    return (
                                        <div key={msg._id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "60%" }}>
                                            <div style={{
                                                background: isMe ? "var(--as-primary)" : "#fff",
                                                color: isMe ? "#fff" : "var(--as-text)",
                                                padding: "12px 16px",
                                                borderRadius: 16,
                                                borderBottomRightRadius: isMe ? 4 : 16,
                                                borderBottomLeftRadius: isMe ? 16 : 4,
                                                boxShadow: "var(--as-shadow-sm)",
                                                fontSize: "0.95rem",
                                                lineHeight: 1.5,
                                                border: isMe ? "none" : "1px solid var(--as-border)"
                                            }}>
                                                {msg.text}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--as-text-muted)", marginTop: 6, textAlign: isMe ? "right" : "left", padding: "0 4px" }}>
                                                {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{ padding: 16, background: "#fff", borderTop: "1px solid var(--as-border)" }}>
                            <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 12 }}>
                                <input
                                    type="text"
                                    className="as-input"
                                    placeholder="Nhập tin nhắn..."
                                    style={{ flex: 1, borderRadius: 24, padding: "12px 20px" }}
                                    value={inputMsg}
                                    onChange={e => setInputMsg(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="as-btn as-btn-primary"
                                    disabled={!inputMsg.trim()}
                                    style={{ width: 48, height: 48, borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--as-text-muted)" }}>
                        <FaStore size={64} style={{ color: "var(--as-border)", marginBottom: 20 }} />
                        <h3 style={{ margin: 0, fontWeight: 600 }}>Cửa sổ Chat</h3>
                        <p style={{ marginTop: 8 }}>Chọn một khách hàng bên trái để bắt đầu nhắn tin</p>
                    </div>
                )}
            </div>
        </div>
    );
}
