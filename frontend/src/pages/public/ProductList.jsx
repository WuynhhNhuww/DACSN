import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaStar, FaFilter, FaSortAmountDown } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import ShopeeFooter from "../../components/ShopeeFooter";

const SORTS = [
    { label: "Mới nhất", val: "newest" },
    { label: "Bán chạy nhất", val: "popular" },
    { label: "Giá thấp → cao", val: "price_asc" },
    { label: "Giá cao → thấp", val: "price_desc" },
];

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

// Hiện thị tên category đẹp hơn (capitalize & replace dashes)
const prettyCat = (c) => c.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

export default function ProductList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState(searchParams.get("category") || "Tất cả");
    const [sort, setSort] = useState("newest");
    const search = searchParams.get("search") || "";

    useEffect(() => {
        const cat = searchParams.get("category");
        if (cat) setCategory(cat);
    }, [searchParams]);

    useEffect(() => {
        axiosClient.get("/api/products/categories")
            .then(res => setCategories(["Tất cả", ...res.data]))
            .catch(() => setCategories(["Tất cả"]));
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ limit: 100 });
        if (search) params.set("search", search);
        if (category && category !== "Tất cả") params.set("category", category);
        if (sort) params.set("sort", sort);
        axiosClient.get(`/api/products?${params.toString()}`)
            .then(res => setProducts(res.data?.products || res.data || []))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [search, category, sort]);

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
            <div className="container pageWrap" style={{ paddingTop: 32, paddingBottom: 60 }}>
                {/* Tiêu đề */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>
                        {search ? `Kết quả cho "${search}"` : category !== "Tất cả" ? prettyCat(category) : "Tất cả sản phẩm"}
                    </h1>
                    {!loading && (
                        <div style={{ fontSize: 13, color: "var(--text-light)", marginTop: 4 }}>
                            Tìm thấy <strong>{products.length}</strong> sản phẩm
                        </div>
                    )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
                    {/* SIDEBAR */}
                    <div>
                        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden", border: "1px solid var(--line)", position: "sticky", top: 90 }}>
                            {/* Categories */}
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-light)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                    <FaFilter size={12} /> DANH MỤC
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {categories.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setCategory(c)}
                                            style={{
                                                textAlign: "left", padding: "9px 12px", border: "none", borderRadius: 10,
                                                background: category === c ? "var(--primary-light)" : "transparent",
                                                color: category === c ? "var(--primary)" : "var(--text)",
                                                fontWeight: category === c ? 700 : 400,
                                                fontSize: 13, cursor: "pointer",
                                                transition: "all 0.15s",
                                                textTransform: c === "Tất cả" ? "none" : "capitalize",
                                            }}
                                        >
                                            {c === "Tất cả" ? c : prettyCat(c)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div style={{ padding: "16px 20px" }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-light)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                    <FaSortAmountDown size={12} /> SẮP XẾP
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {SORTS.map(s => (
                                        <button
                                            key={s.val}
                                            onClick={() => setSort(s.val)}
                                            style={{
                                                textAlign: "left", padding: "9px 12px", border: "none", borderRadius: 10,
                                                background: sort === s.val ? "var(--primary-light)" : "transparent",
                                                color: sort === s.val ? "var(--primary)" : "var(--text)",
                                                fontWeight: sort === s.val ? 700 : 400,
                                                fontSize: 13, cursor: "pointer",
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRODUCT GRID */}
                    <div>
                        {loading ? (
                            <div className="products" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} style={{ height: 320, borderRadius: 16, background: "#e2e8f0", animation: "pulse 1.5s infinite" }} />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div style={{ padding: 60, textAlign: "center", background: "#fff", borderRadius: 20, boxShadow: "var(--shadow-sm)" }}>
                                <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
                                <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Không tìm thấy sản phẩm</h3>
                                <p style={{ color: "var(--text-light)", fontSize: 14 }}>Hãy thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
                            </div>
                        ) : (
                            <div className="products" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                                {products.map(p => {
                                    const fp = p.finalPrice ?? p.price;
                                    const hasDiscount = fp < p.price;
                                    const pct = hasDiscount ? Math.round((1 - fp / p.price) * 100) : 0;
                                    return (
                                        <div
                                            key={p._id}
                                            className="pCard"
                                            onClick={() => navigate(`/product/${p._id}`)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="pWrap">
                                                <div className="pImg" style={{ height: 200 }}>
                                                    {p.images?.[0]
                                                        ? <img src={p.images[0]} alt={p.name} />
                                                        : <span style={{ fontSize: 40, opacity: 0.15 }}>📦</span>
                                                    }
                                                </div>
                                                {hasDiscount && <div className="pTagSale">-{pct}%</div>}
                                            </div>
                                            <div className="pBody" style={{ padding: "12px 14px" }}>
                                                <div className="pName" style={{ height: 42, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{p.name}</div>
                                                <div className="pRating" style={{ margin: "4px 0 6px" }}>
                                                    {Array(5).fill(0).map((_, i) => (
                                                        <FaStar key={i} size={11} style={{ opacity: i < Math.round(p.ratingAvg || 0) ? 1 : 0.2, color: "#f59e0b" }} />
                                                    ))}
                                                    {p.ratingCount > 0 && <span style={{ fontSize: 11, color: "var(--text-lighter)", marginLeft: 4 }}>({p.ratingCount})</span>}
                                                </div>
                                                <div className="pPriceRow">
                                                    <div>
                                                        <div className="pPrice" style={{ fontSize: 15 }}>{fmt(fp)}</div>
                                                        {hasDiscount && <div className="pOldPrice">{fmt(p.price)}</div>}
                                                    </div>
                                                    <div className="pSold" style={{ fontSize: 11 }}>Đã bán {p.sold || 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ShopeeFooter />
        </div>
    );
}
