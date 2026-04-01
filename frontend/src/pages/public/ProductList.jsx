import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaStar, FaFilter } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import ShopeeFooter from "../../components/ShopeeFooter";

const SORTS = [
    { label: "Newest", val: "newest" },
    { label: "Popular", val: "popular" },
    { label: "Price: Low to High", val: "price_asc" },
    { label: "Price: High to Low", val: "price_desc" },
];

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

export default function ProductList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState(searchParams.get("category") || "Tất cả");
    const [sort, setSort] = useState("newest");
    const search = searchParams.get("search") || "";

    // Sync category from URL
    useEffect(() => {
        const cat = searchParams.get("category");
        if (cat) setCategory(cat);
    }, [searchParams]);

    // Fetch Categories
    useEffect(() => {
        axiosClient.get("/api/products/categories")
            .then(res => setCategories(["Tất cả", ...res.data]))
            .catch(() => setCategories(["Tất cả"]));
    }, []);

    // Fetch Products
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
            <div className="container pageWrap" style={{ paddingTop: 30, paddingBottom: 60 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                        {search ? `Results for "${search}"` : category !== "Tất cả" ? category.replace("-", " ") : "All Products"}
                        {!loading && <span style={{ fontSize: 16, fontWeight: 400, color: "var(--text-light)", marginLeft: 12 }}>({products.length})</span>}
                    </h1>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
                    {/* SIDEBAR FILTER */}
                    <div className="sidebar" style={{ background: "#fff", padding: 24, borderRadius: 16, height: "fit-content", boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                            <FaFilter size={14} /> CATEGORIES
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {categories.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCategory(c)}
                                    style={{
                                        textAlign: "left", padding: "10px 14px", border: "none", borderRadius: 8,
                                        background: category === c ? "var(--primary-light)" : "transparent",
                                        color: category === c ? "var(--primary)" : "var(--text)",
                                        fontWeight: category === c ? 700 : 400,
                                        fontSize: 13, textTransform: "capitalize", cursor: "pointer"
                                    }}
                                >
                                    {c.replace("-", " ")}
                                </button>
                            ))}
                        </div>

                        <div style={{ fontWeight: 700, margin: "24px 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                            SORT BY
                        </div>
                        <select
                            className="formControl"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)" }}
                        >
                            {SORTS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                        </select>
                    </div>

                    {/* PRODUCT GRID */}
                    <div>
                        {loading ? (
                            <div className="products" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16, background: "#e2e8f0" }} />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="card" style={{ padding: 60, textAlign: "center", borderRadius: 16, background: "#fff" }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                                <h3>No products found</h3>
                                <p style={{ color: "var(--text-light)" }}>Try adjusting your filters or search terms</p>
                            </div>
                        ) : (
                            <div className="products" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                                {products.map(p => {
                                    const fp = p.finalPrice ?? p.price;
                                    return (
                                        <div key={p._id} className="pCard" onClick={() => navigate(`/product/${p._id}`)}>
                                            <div className="pWrap">
                                                <div className="pImg" style={{ height: 200 }}>
                                                    <img src={p.images?.[0]} alt={p.name} />
                                                </div>
                                            </div>
                                            <div className="pBody" style={{ padding: 16 }}>
                                                <div className="pName" style={{ height: 42, overflow: "hidden", fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{p.name}</div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div className="pPrice" style={{ fontSize: 16 }}>{fmt(fp)}</div>
                                                    <div className="pSold" style={{ fontSize: 11, color: "var(--text-light)" }}>{p.sold} sold</div>
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
