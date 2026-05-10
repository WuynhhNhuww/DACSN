import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FaRobot, FaTimes, FaPaperPlane, FaUser } from "react-icons/fa";
import axiosClient from "../api/axiosClient";

export default function ChatAI() {
    const location = useLocation();
    const params = useParams();
    const productId = location.pathname.startsWith("/product/") ? params.id : null;

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "model", text: "Xin chào! Tôi là trợ lý AI của Shopee Mini. Tôi có thể giúp gì cho bạn hôm nay?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        const newMessages = [...messages, { role: "user", text: userMessage }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const pathParts = location.pathname.split("/");
            const potentialId = pathParts.pop();
            const pid = (location.pathname.startsWith("/product/") && potentialId?.match(/^[0-9a-fA-F]{24}$/)) ? potentialId : null;

            const res = await axiosClient.post("/api/ai/chat", { 
                message: userMessage,
                history,
                productId: pid
            });

            setMessages(prev => [...prev, { role: "model", text: res.data.text }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "model", text: "Xin lỗi, hiện tại tôi đang gặp chút sự cố kết nối. Bạn thử lại sau nhé!" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: "fixed", bottom: 30, right: 30, zIndex: 9999 }}>
            {/* Chat Bubble Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        color: "white",
                        border: "none",
                        boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                    <FaRobot />
                    <div style={{ position: "absolute", top: 0, right: 0, width: 15, height: 15, background: "#10b981", borderRadius: "50%", border: "2px solid white" }} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    width: 380,
                    height: 520,
                    background: "white",
                    borderRadius: 24,
                    boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: "1px solid var(--line)"
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "20px 24px",
                        background: "linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)",
                        color: "white",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 40, height: 40, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                                <FaRobot />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>AI Assistant</div>
                                <div style={{ fontSize: 12, opacity: 0.8, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ width: 6, height: 6, background: "#10b981", borderRadius: "50%" }} /> Online
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 20 }}>
                            <FaTimes />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        padding: 24,
                        overflowY: "auto",
                        background: "#f8fafc",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                                animation: "fadeIn 0.3s ease"
                            }}>
                                <div style={{
                                    maxWidth: "85%",
                                    padding: "12px 18px",
                                    borderRadius: 18,
                                    fontSize: 14,
                                    lineHeight: 1.5,
                                    background: msg.role === "user" ? "var(--primary)" : "white",
                                    color: msg.role === "user" ? "white" : "var(--text)",
                                    boxShadow: msg.role === "user" ? "0 4px 12px rgba(79, 70, 229, 0.2)" : "0 4px 12px rgba(0,0,0,0.05)",
                                    borderBottomRightRadius: msg.role === "user" ? 4 : 18,
                                    borderBottomLeftRadius: msg.role === "user" ? 18 : 4
                                }}>
                                    {msg.text}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text-lighter)", marginTop: 4, padding: "0 4px" }}>
                                    {msg.role === "user" ? "Bạn" : "Shopee AI"}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: "flex", gap: 4, padding: 8 }}>
                                <div className="dot" style={{ width: 8, height: 8, background: "var(--text-lighter)", borderRadius: "50%", animation: "bounce 1.4s infinite ease-in-out both" }} />
                                <div className="dot" style={{ width: 8, height: 8, background: "var(--text-lighter)", borderRadius: "50%", animation: "bounce 1.4s infinite 0.2s ease-in-out both" }} />
                                <div className="dot" style={{ width: 8, height: 8, background: "var(--text-lighter)", borderRadius: "50%", animation: "bounce 1.4s infinite 0.4s ease-in-out both" }} />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} style={{
                        padding: "16px 20px",
                        background: "white",
                        display: "flex",
                        gap: 12,
                        borderTop: "1px solid var(--line)"
                    }}>
                        <input
                            type="text"
                            placeholder="Nhập câu hỏi tại đây..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            style={{
                                flex: 1,
                                border: "none",
                                background: "#f1f5f9",
                                padding: "12px 18px",
                                borderRadius: 12,
                                fontSize: 14,
                                outline: "none"
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: "var(--primary)",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                opacity: !input.trim() || loading ? 0.5 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <FaPaperPlane />
                        </button>
                    </form>
                </div>
            )}

            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
