import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaShoppingCart, FaBolt, FaShieldAlt, FaUndo, FaTruck, FaHeart, FaRegHeart, FaCommentDots, FaStore, FaTimes, FaPaperPlane } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import ShopeeFooter from "../../components/ShopeeFooter";
import { toggleWishlist, getWishlist } from "../../api/userApi";

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) || {};

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImg, setMainImg] = useState(0);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState("");
    const [inWishlist, setInWishlist] = useState(false);
    const [wishLoading, setWishLoading] = useState(false);
    const [reviews, setReviews] = useState([]);

    // Review form states
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [reviewImage, setReviewImage] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    // Chat states
    const [chatModal, setChatModal] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                const [productRes, reviewRes] = await Promise.all([
                    axiosClient.get(`/api/products/${id}`),
                    axiosClient.get(`/api/reviews/product/${id}`)
                ]);

                setProduct(productRes.data);
                setReviews(reviewRes.data);
            } catch (err) {
                console.error("Lỗi tải chi tiết sản phẩm:", err);
                setError("Không tìm thấy sản phẩm.");
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetail();

        if (user) {
            getWishlist()
                .then(res => {
                    setInWishlist((res.data || []).some(p => p._id === id || p === id));
                })
                .catch(() => { });
        }
    }, [id, user]);

    const addToCart = async () => {
        if (!user) { navigate("/login"); return false; }
        if (user.role === "seller" || user.role === "admin") return false;

        try {
            await axiosClient.post("/api/cart", { productId: id, quantity: qty });
            window.dispatchEvent(new Event("cart:updated"));
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
            return true;
        } catch (err) {
            const raw = localStorage.getItem("modern_store_cart");
            const cart = raw ? JSON.parse(raw) : [];
            const idx = cart.findIndex(x => x.id === id);
            if (idx > -1) cart[idx].qty = Math.min(99, cart[idx].qty + qty);
            else cart.push({ id, name: product.name, price: product.finalPrice ?? product.price, qty, image: product.images?.[0] });
            localStorage.setItem("modern_store_cart", JSON.stringify(cart));
            window.dispatchEvent(new Event("cart:updated"));
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        if (!user) return navigate("/login");
        if (!comment.trim()) return alert("Vui lòng nhập nội dung đánh giá");

        setSubmittingReview(true);
        try {
            const res = await axiosClient.post("/api/reviews", {
                productId: id,
                rating,
                comment,
                images: reviewImage ? [reviewImage] : []
            });
            setReviews([{ ...res.data.review, buyer: { name: user.name } }, ...reviews]);
            setComment("");
            setReviewImage("");
            alert("Đánh giá thành công!");
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi gửi đánh giá");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleReviewImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) return alert("File ảnh quá lớn, vui lòng chọn file dưới 2MB.");
            const reader = new FileReader();
            reader.onloadend = () => {
                setReviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (chatModal && product?.seller?._id && user) {
            axiosClient.get(`/api/chat/${product.seller._id}`)
                .then(res => { setMessages(res.data || []); scrollToBottom(); })
                .catch(console.error);
        }
    }, [chatModal, product?.seller?._id, user]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMsg.trim() || !product?.seller?._id || !user) {
            if (!user) navigate("/login");
            return;
        }
        try {
            const res = await axiosClient.post("/api/chat", {
                receiverId: product.seller._id,
                text: newMsg
            });
            setMessages(prev => [...prev, res.data]);
            setNewMsg("");
            scrollToBottom();
        } catch (err) {
            console.error("Gửi tin nhắn thất bại", err);
        }
    };

    if (loading) return <div className="loading" style={{ marginTop: 60 }}>Đang tải thông tin sản phẩm...</div>;
    if (error || !product) return (
        <div className="container" style={{ padding: "60px 0", textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>😕</div>
            <h2 style={{ marginTop: 16 }}>Sản phẩm không tồn tại</h2>
            <button className="btn btn-primary" onClick={() => navigate("/products")} style={{ marginTop: 16 }}>Trở về Trang sản phẩm</button>
        </div>
    );

    const fp = product.finalPrice ?? product.price;
    const hasDiscount = fp < product.price;
    const pct = hasDiscount ? Math.round((1 - fp / product.price) * 100) : 0;
    const images = product.images?.length ? product.images : [""];

    const handleBuyNow = async () => {
        const ok = await addToCart();
        if (ok) {
            const selectedItems = [{
                id: id,
                name: product.name,
                price: fp,
                image: images[mainImg] || "",
                qty: qty,
                seller: product.seller,
            }];
            navigate("/buyer/checkout", { state: { selectedItems } });
        }
    };

    return (
        <div style={{ background: "var(--bg)", paddingBottom: 40 }}>
            <div className="container" style={{ paddingTop: 24 }}>
                {/* Breadcrumb */}
                <div style={{ fontSize: 13, color: "var(--text-light)", marginBottom: 24, display: "flex", gap: 8 }}>
                    <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Trang chủ</span> /
                    <span onClick={() => navigate("/products")} style={{ cursor: "pointer", textTransform: "capitalize" }}>{product.category || "Danh mục"}</span> /
                    <span style={{ color: "var(--text)" }}>{product.name}</span>
                </div>

                {/* MAIN CARD */}
                <div className="pdWrap" style={{ background: "#fff", padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                    {/* LEFT */}
                    <div className="pdLeft">
                        <div className="pdMainImg" style={{ borderRadius: 16, overflow: "hidden" }}>
                            {images[mainImg] ? <img src={images[mainImg]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 80, opacity: .15 }}>📦</span>}
                        </div>
                        <div className="pdThumbRow" style={{ marginTop: 16 }}>
                            {images.map((img, i) => (
                                <div key={i} className={`pdThumb ${mainImg === i ? "active" : ""}`} onClick={() => setMainImg(i)} style={{ borderRadius: 12, overflow: "hidden" }}>
                                    {img ? <img src={img} alt="" /> : <span style={{ fontSize: 24, opacity: .2 }}>📦</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="pdRight">
                        {hasDiscount && <div className="pdBadge" style={{ background: "var(--accent)", color: "#fff", borderRadius: 8 }}>GIẢM {pct}%</div>}
                        <h1 className="pdName" style={{ fontSize: 32, fontWeight: 800, margin: "12px 0" }}>{product.name}</h1>

                        <div className="pdMeta" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, fontSize: 14 }}>
                            {product.ratingCount > 0 && (
                                <span className="rating" style={{ display: "flex", alignItems: "center", gap: 4 }}><FaStar style={{ color: "#fbbf24" }} />{product.ratingAvg?.toFixed(1)} ({product.ratingCount} đánh giá)</span>
                            )}
                            <span style={{ color: "var(--text-light)" }}>Đã bán: {product.sold || 0}</span>
                            <span style={{ color: product.stock > 0 ? (product.stock < 10 ? "#f97316" : "#10b981") : "#f43f5e", fontWeight: 600 }}>
                                {product.stock === 0 ? "Hết hàng" : 
                                 product.stock < 10 ? `Chỉ còn ${product.stock} sản phẩm` : 
                                 "Còn hàng"}
                            </span>
                        </div>

                        <div className="pdPriceBox" style={{ background: "#f8fafc", padding: "20px 24px", borderRadius: 16, marginBottom: 24 }}>
                            {hasDiscount && <span className="pdOldPrice" style={{ fontSize: 18 }}>{fmt(product.price)}</span>}
                            <span className="pdPrice" style={{ color: "var(--primary)", fontSize: 32, fontWeight: 800 }}>{fmt(fp)}</span>
                        </div>

                        {/* Features */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                            {[
                                { icon: <FaTruck />, text: "Miễn phí vận chuyển" },
                                { icon: <FaShieldAlt />, text: "100% Chính hãng" },
                                { icon: <FaUndo />, text: "14 Ngày đổi trả" },
                            ].map(b => (
                                <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-light)" }}>
                                    <span style={{ color: "var(--primary)" }}>{b.icon}</span> {b.text}
                                </div>
                            ))}
                        </div>

                        {/* SHOP INFO */}
                        {product.seller && (
                            <div
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "rgba(79, 70, 229, 0.04)", borderRadius: 16, border: "1px dashed var(--primary)", marginBottom: 24, cursor: "pointer", transition: "all 0.2s" }}
                                onClick={() => navigate(`/shop/${product.seller._id}`)}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary)", color: "white", display: "grid", placeItems: "center", fontWeight: 800 }}>
                                        {product.seller?.sellerInfo?.shopName ? product.seller.sellerInfo.shopName.charAt(0).toUpperCase() : <FaStore />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 15 }}>{product.seller?.sellerInfo?.shopName || product.seller.name}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-light)" }}>Khám phá Cửa Hàng</div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-outline"
                                    style={{ padding: "8px 16px", borderRadius: 12, fontSize: 13, gap: 6, borderColor: "var(--primary)", color: "var(--primary)", background: "#fff" }}
                                    onClick={(e) => { e.stopPropagation(); setChatModal(true); }}
                                >
                                    <FaCommentDots /> Chat với Shop
                                </button>
                            </div>
                        )}

                        {/* QTY */}
                        <div className="pdQty" style={{ marginBottom: 32 }}>
                            <span style={{ fontWeight: 600 }}>Số lượng</span>
                            <div className="pdQtyControl" style={{ border: "1px solid var(--line)", borderRadius: 12 }}>
                                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: "8px 16px" }}>−</button>
                                <span style={{ padding: "8px 20px", fontWeight: 700 }}>{qty}</span>
                                <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} style={{ padding: "8px 16px" }}>+</button>
                            </div>
                        </div>

                        {added && <div className="alert alert-success" style={{ marginBottom: 12, borderRadius: 12 }}>✓ Đã thêm vào giỏ hàng!</div>}

                        <div className="pdActions" style={{ gap: 16 }}>
                            {(!user || (user.role !== "seller" && user.role !== "admin")) ? (
                                <>
                                    <button className="btn btn-outline" onClick={addToCart} disabled={product.stock === 0} style={{ flex: 1, padding: 16, borderRadius: 14 }}>
                                        <FaShoppingCart /> Thêm vào Giỏ
                                    </button>
                                    <button className="btn btn-primary" onClick={handleBuyNow} disabled={product.stock === 0} style={{ flex: 1, padding: 16, borderRadius: 14 }}>
                                        <FaBolt /> Mua Ngay
                                    </button>
                                </>
                            ) : (
                                <div style={{ color: "var(--accent)", fontSize: "14px", fontWeight: 600, padding: "12px 20px", background: "var(--accent-light)", borderRadius: 12, flex: 1 }}>
                                    Vai trò Người Bán/Quản Trị không thể mua hàng. Vui lòng sử dụng tài khoản Người Mua.
                                </div>
                            )}
                            {user && user.role !== "seller" && user.role !== "admin" && (
                                <button
                                    onClick={async () => {
                                        setWishLoading(true);
                                        try {
                                            const res = await toggleWishlist(id);
                                            setInWishlist(res.data.inWishlist);
                                        } catch { }
                                        setWishLoading(false);
                                    }}
                                    disabled={wishLoading}
                                    className="wishlistBtn"
                                    style={{
                                        background: inWishlist ? "var(--accent-light)" : "#fff",
                                        border: `1px solid ${inWishlist ? "var(--accent)" : "var(--line)"}`,
                                        borderRadius: 14, padding: "0 20px",
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                        color: inWishlist ? "var(--accent)" : "var(--text-light)", fontSize: 20,
                                        height: 54, transition: "all 0.2s"
                                    }}
                                >
                                    {inWishlist ? <FaHeart /> : <FaRegHeart />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* DESCRIPTION */}
                <div className="pdDesc" style={{ marginTop: 32, background: "#fff", padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>CHI TIẾT SẢN PHẨM</h3>
                    <p style={{ whiteSpace: "pre-wrap", color: "var(--text-light)", lineHeight: 1.8 }}>{product.description}</p>
                </div>

                {/* REVIEWS */}
                <div className="pdReviews" style={{ marginTop: 32, background: "#fff", padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>ĐÁNH GIÁ SẢN PHẨM</h3>

                    {/* Form Gửi Đánh Giá */}
                    {user && user.role !== "seller" && user.role !== "admin" && (
                        <div style={{ marginBottom: 32, background: "#f8fafc", padding: 24, borderRadius: 16, border: "1px solid var(--line)" }}>
                            <h4 style={{ margin: "0 0 16px 0", fontSize: 16 }}>Gửi đánh giá của bạn</h4>
                            <form onSubmit={submitReview} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontWeight: 600 }}>Chất lượng:</span>
                                    <div style={{ display: "flex", gap: 4, cursor: "pointer" }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <FaStar
                                                key={star}
                                                size={22}
                                                color={star <= rating ? "#fbbf24" : "#e2e8f0"}
                                                onClick={() => setRating(star)}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    className="as-input"
                                    placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này (chỉ được đánh giá sau khi đã mua)..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    style={{ height: 100, resize: "none" }}
                                    required
                                />
                                <div className="formGroup" style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-light)", marginBottom: 8, display: "block" }}>
                                        Thêm hình ảnh (Tùy chọn)
                                    </label>
                                    <input type="file" accept="image/*" onChange={handleReviewImageUpload} style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 12 }} />
                                    {reviewImage && (
                                        <div style={{ marginTop: 12, position: "relative", width: "fit-content" }}>
                                            <img src={reviewImage} alt="Preview" style={{ height: 100, borderRadius: 8, objectFit: "cover", border: "1px solid var(--line)" }} />
                                            <button type="button" onClick={() => setReviewImage("")} style={{ position: "absolute", top: -8, right: -8, background: "#f43f5e", color: "white", border: "none", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>✕</button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submittingReview}
                                    style={{ alignSelf: "flex-end", padding: "10px 24px", borderRadius: 8 }}
                                >
                                    {submittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
                                </button>
                            </form>
                        </div>
                    )}

                    {reviews.length === 0 ? (
                        <div style={{ textAlign: "center", color: "var(--text-lighter)", padding: "40px 0" }}>
                            <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>💬</span>
                            Chưa có nhận xét nào.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                            {reviews.map(rev => (
                                <div key={rev._id} style={{ display: "flex", gap: 16, borderBottom: "1px solid var(--line)", paddingBottom: 24 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                                        {rev.buyer?.name?.charAt(0)?.toUpperCase() || rev.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                            <span style={{ fontWeight: 700, color: "var(--text)" }}>{rev.buyer?.name || rev.user?.name || "Người mua"}</span>
                                            <span style={{ fontSize: 13, color: "var(--text-lighter)" }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ color: "#fbbf24", marginBottom: 8, fontSize: 14 }}>
                                            {Array(5).fill(0).map((_, i) => <FaStar key={i} style={{ opacity: i < (rev.stars || rev.rating) ? 1 : 0.3 }} />)}
                                        </div>
                                        <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>{rev.comment}</p>
                                        
                                        {rev.images && rev.images.length > 0 && (
                                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                                {rev.images.map((img, idx) => (
                                                    <img key={idx} src={img} alt="review" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                                                ))}
                                            </div>
                                        )}

                                        {rev.sellerReply && (
                                            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginTop: 12, border: "1px solid var(--line)" }}>
                                                <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--primary)" }}>Phản hồi từ Cửa hàng:</div>
                                                <div style={{ fontSize: 13, color: "var(--text-light)" }}>{rev.sellerReply}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Modal */}
            {chatModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                    <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 450, display: "flex", flexDirection: "column", height: 500, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
                        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", background: "var(--primary)", color: "white", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                            <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                <FaStore /> {product.seller?.sellerInfo?.shopName || "Cửa hàng"}
                            </div>
                            <button onClick={() => setChatModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}><FaTimes size={16} /></button>
                        </div>

                        <div style={{ flex: 1, padding: 20, overflowY: "auto", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 12 }}>
                            {messages.length === 0 ? (
                                <div style={{ margin: "auto", color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center" }}>Bắt đầu cuộc trò chuyện với Shop.<br />Tin nhắn của bạn sẽ được trả lời sớm nhất.</div>
                            ) : (
                                messages.map(m => {
                                    const isMe = user && m.sender === user._id;
                                    return (
                                        <div key={m._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                            <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: 16, background: isMe ? "var(--primary)" : "white", color: isMe ? "white" : "var(--text)", border: isMe ? "none" : "1px solid var(--line)", fontSize: "0.95rem", lineHeight: 1.4, borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                                {m.text}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "white", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                            {user ? (
                                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 12 }}>
                                    <input
                                        style={{ flex: 1, padding: "10px 16px", borderRadius: 20, border: "1px solid var(--line)", outline: "none", background: "rgba(0,0,0,0.02)" }}
                                        placeholder="Nhập tin nhắn..."
                                        value={newMsg}
                                        onChange={e => setNewMsg(e.target.value)}
                                        autoFocus
                                    />
                                    <button type="submit" className="btn btn-primary" style={{ padding: "0 20px", borderRadius: 20, display: "flex", alignItems: "center", gap: 8 }} disabled={!newMsg.trim()}>
                                        <FaPaperPlane />
                                    </button>
                                </form>
                            ) : (
                                <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-light)" }}>
                                    Vui lòng <a href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>đăng nhập</a> để chat với Shop.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ShopeeFooter />
        </div>
    );
}
