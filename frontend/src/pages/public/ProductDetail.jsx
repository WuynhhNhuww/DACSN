import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaShoppingCart, FaBolt, FaShieldAlt, FaUndo, FaTruck, FaHeart, FaRegHeart } from "react-icons/fa";
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

    useEffect(() => {
        axiosClient.get(`/api/products/${id}`)
            .then(res => setProduct(res.data))
            .catch(() => setError("Product not found."))
            .finally(() => setLoading(false));

        if (user) {
            getWishlist().then(res => {
                setInWishlist((res.data || []).some(p => p._id === id || p === id));
            }).catch(() => { });
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
            return true;
        }
    };

    if (loading) return <div className="loading" style={{ marginTop: 60 }}>Loading essence of product...</div>;
    if (error || !product) return (
        <div className="container" style={{ padding: "60px 0", textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>😕</div>
            <h2 style={{ marginTop: 16 }}>Product Not Found</h2>
            <button className="btn btn-primary" onClick={() => navigate("/products")} style={{ marginTop: 16 }}>Go to Products</button>
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
                    <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Home</span> /
                    <span onClick={() => navigate("/products")} style={{ cursor: "pointer", textTransform: "capitalize" }}>{product.category || "Products"}</span> /
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
                        {hasDiscount && <div className="pdBadge" style={{ background: "var(--accent)", color: "#fff", borderRadius: 8 }}>SAVE {pct}%</div>}
                        <h1 className="pdName" style={{ fontSize: 32, fontWeight: 800, margin: "12px 0" }}>{product.name}</h1>

                        <div className="pdMeta" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, fontSize: 14 }}>
                            {product.ratingCount > 0 && (
                                <span className="rating" style={{ display: "flex", alignItems: "center", gap: 4 }}><FaStar style={{ color: "#fbbf24" }} />{product.ratingAvg?.toFixed(1)} ({product.ratingCount} reviews)</span>
                            )}
                            <span style={{ color: "var(--text-light)" }}>{product.sold || 0} sold</span>
                            <span style={{ color: product.stock > 0 ? "#10b981" : "#f43f5e", fontWeight: 600 }}>
                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                            </span>
                        </div>

                        <div className="pdPriceBox" style={{ background: "#f8fafc", padding: "20px 24px", borderRadius: 16, marginBottom: 24 }}>
                            {hasDiscount && <span className="pdOldPrice" style={{ fontSize: 18 }}>{fmt(product.price)}</span>}
                            <span className="pdPrice" style={{ color: "var(--primary)", fontSize: 32, fontWeight: 800 }}>{fmt(fp)}</span>
                        </div>

                        {/* Features */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                            {[
                                { icon: <FaTruck />, text: "Free Fast Delivery" },
                                { icon: <FaShieldAlt />, text: "100% Genuine Pro" },
                                { icon: <FaUndo />, text: "14 Days Return" },
                            ].map(b => (
                                <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-light)" }}>
                                    <span style={{ color: "var(--primary)" }}>{b.icon}</span> {b.text}
                                </div>
                            ))}
                        </div>

                        {/* QTY */}
                        <div className="pdQty" style={{ marginBottom: 32 }}>
                            <span style={{ fontWeight: 600 }}>Quantity</span>
                            <div className="pdQtyControl" style={{ border: "1px solid var(--line)", borderRadius: 12 }}>
                                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: "8px 16px" }}>−</button>
                                <span style={{ padding: "8px 20px", fontWeight: 700 }}>{qty}</span>
                                <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} style={{ padding: "8px 16px" }}>+</button>
                            </div>
                        </div>

                        {added && <div className="alert alert-success" style={{ marginBottom: 12, borderRadius: 12 }}>✓ Added to your collection!</div>}

                        <div className="pdActions" style={{ gap: 16 }}>
                            {(!user || (user.role !== "seller" && user.role !== "admin")) ? (
                                <>
                                    <button className="btn btn-outline" onClick={addToCart} disabled={product.stock === 0} style={{ flex: 1, padding: 16, borderRadius: 14 }}>
                                        <FaShoppingCart /> Add to Cart
                                    </button>
                                    <button className="btn btn-primary" onClick={handleBuyNow} disabled={product.stock === 0} style={{ flex: 1, padding: 16, borderRadius: 14 }}>
                                        <FaBolt /> Buy Now
                                    </button>
                                </>
                            ) : (
                                <div style={{ color: "var(--accent)", fontSize: "14px", fontWeight: 600, padding: "12px 20px", background: "var(--accent-light)", borderRadius: 12, flex: 1 }}>
                                    Purchase is restricted for Seller/Admin roles. Please use a Buyer account.
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
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>PRODUCT SPECIFICATION</h3>
                    <p style={{ whiteSpace: "pre-wrap", color: "var(--text-light)", lineHeight: 1.8 }}>{product.description}</p>
                </div>
            </div>
            <ShopeeFooter />
        </div>
    );
}
