import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { getWishlist, toggleWishlist } from "../../api/userApi";
import ShopeeFooter from "../../components/ShopeeFooter";
import { FaStar, FaHeart, FaShoppingCart, FaShoppingBag, FaStore } from "react-icons/fa";

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

export default function Wishlist() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        if (!user) return navigate("/login");
        loadWishlist();
    }, [user, navigate]);

    const loadWishlist = async () => {
        setLoading(true);
        try {
            const res = await getWishlist();
            setProducts(res.data || []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (productId) => {
        setRemovingId(productId);
        try {
            await toggleWishlist(productId);
            setProducts(prev => prev.filter(p => p._id !== productId));
        } catch { }
        setRemovingId(null);
    };

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 80 }}>
            <div className="container" style={{ paddingTop: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                    <FaHeart color="var(--accent)" size={28} />
                    <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>My Wishlist</h1>
                    <span style={{ fontSize: 16, color: "var(--text-light)", fontWeight: 500, background: "var(--bg-card)", padding: "4px 12px", borderRadius: 12, border: "1px solid var(--line)" }}>{products.length} items</span>
                </div>

                {loading ? (
                    <div className="products">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="pCard">
                                <div className="skeleton" style={{ height: 240, borderRadius: 20 }} />
                                <div style={{ padding: 20 }}>
                                    <div className="skeleton" style={{ height: 16, marginBottom: 10, borderRadius: 8 }} />
                                    <div className="skeleton" style={{ height: 16, width: "60%", borderRadius: 8 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: 80, borderRadius: 32, background: "#fff", boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ fontSize: 72, marginBottom: 24 }}>💝</div>
                        <h2 style={{ marginBottom: 12 }}>Your wishlist is empty</h2>
                        <p style={{ color: "var(--text-light)", marginBottom: 32 }}>Find something you love and save it here!</p>
                        <button className="btn btn-primary" onClick={() => navigate("/products")} style={{ padding: "14px 32px", borderRadius: 12 }}>Explore Products</button>
                    </div>
                ) : (
                    <div className="products">
                        {products.map(p => {
                            const fp = p.finalPrice ?? p.price;
                            const hasDiscount = fp < p.price;
                            const pct = hasDiscount ? Math.round((1 - fp / p.price) * 100) : 0;
                            return (
                                <div key={p._id} className="pCard" style={{ position: "relative", borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-8px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                                    {/* Remove from wishlist */}
                                    <button
                                        onClick={() => handleRemove(p._id)}
                                        disabled={removingId === p._id}
                                        style={{
                                            position: "absolute", top: 16, right: 16, zIndex: 2,
                                            background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%",
                                            width: 36, height: 36, cursor: "pointer", display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backdropFilter: "blur(4px)"
                                        }}
                                        title="Remove from wishlist"
                                    >
                                        <FaHeart color="var(--accent)" size={16} />
                                    </button>

                                    {/* Product Image */}
                                    <div className="pWrap" onClick={() => navigate(`/product/${p._id}`)} style={{ cursor: "pointer", height: 240, background: "#f8fafc" }}>
                                        <div className="pImg" style={{ height: "100%" }}>
                                            {p.images?.[0]
                                                ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                : <span style={{ fontSize: 48, opacity: .1 }}>📦</span>}
                                        </div>
                                        {hasDiscount && <div className="pTagSale" style={{ top: 16, left: 16, borderRadius: 8, fontWeight: 800 }}>-{pct}%</div>}
                                    </div>

                                    <div className="pBody" style={{ padding: 24 }}>
                                        <div className="pName" onClick={() => navigate(`/product/${p._id}`)} style={{ cursor: "pointer", fontSize: 16, fontWeight: 700, marginBottom: 12, height: 44, overflow: "hidden" }}>
                                            {p.name}
                                        </div>
                                        <div className="pPriceRow" style={{ marginBottom: 16 }}>
                                            <div>
                                                {hasDiscount && <div className="pOldPrice" style={{ fontSize: 13 }}>{fmt(p.price)}</div>}
                                                <div className="pPrice" style={{ fontSize: 20, color: "var(--primary)", fontWeight: 800 }}>{fmt(fp)}</div>
                                            </div>
                                            <div className="pSold" style={{ fontSize: 12, fontWeight: 600 }}>{p.sold > 0 ? `${p.sold} sold` : ""}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                            {p.ratingCount > 0 ? (
                                                <div className="pRating" style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                                    <FaStar color="#f59e0b" size={14} style={{ marginRight: 4 }} /> {p.ratingAvg?.toFixed(1)} <span style={{ color: "var(--text-lighter)", fontWeight: 400 }}>({p.ratingCount})</span>
                                                </div>
                                            ) : <div />}
                                            <div style={{ fontSize: 12, color: "var(--text-lighter)", display: "flex", alignItems: "center", gap: 4 }}>
                                                <FaStore /> {p.seller?.sellerInfo?.shopName || "WPN"}
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: "100%", fontSize: 14, fontWeight: 700, padding: "12px 0", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                                            onClick={() => navigate(`/product/${p._id}`)}
                                        >
                                            <FaShoppingCart />
                                            View Product
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <ShopeeFooter />
        </div>
    );
}
