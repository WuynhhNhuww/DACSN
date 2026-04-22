import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { FaStore, FaStar, FaBox, FaSearch, FaCommentDots } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import ShopeeFooter from "../../components/ShopeeFooter";

const fmt = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);

export default function ShopDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // States
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loadingShop, setLoadingShop] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Search within shop
    const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
    const searchQuery = searchParams.get("search") || "";

    useEffect(() => {
        // Lấy thông tin Shop
        axiosClient.get(`/api/users/shop/${id}`)
            .then(res => setShop(res.data))
            .catch(err => {
                console.error("Lỗi lấy thông tin shop:", err);
                setShop(null);
            })
            .finally(() => setLoadingShop(false));
    }, [id]);

    useEffect(() => {
        // Lấy sản phẩm của Shop đó
        setLoadingProducts(true);
        axiosClient.get(`/api/products?seller=${id}&limit=12&page=${page}${searchQuery ? `&search=${searchQuery}` : ""}`)
            .then(res => {
                setProducts(res.data.products);
                setTotalPages(res.data.pages);
            })
            .catch(err => {
                console.error("Lỗi lấy sản phẩm shop:", err);
            })
            .finally(() => setLoadingProducts(false));
    }, [id, page, searchQuery]);

    // Lấy vouchers của shop
    const [shopVouchers, setShopVouchers] = useState([]);
    const [savedVouchers, setSavedVouchers] = useState([]);
    
    useEffect(() => {
        Promise.all([
            axiosClient.get(`/api/vouchers?scope=shop&sellerId=${id}`).catch(() => ({ data: [] })),
            axiosClient.get("/api/users/vouchers").catch(() => ({ data: [] }))
        ]).then(([resVouchers, resSaved]) => {
            setShopVouchers(resVouchers.data || []);
            setSavedVouchers(resSaved.data || []);
        });
    }, [id]);

    const handleSaveVoucher = async (code) => {
        try {
            const res = await axiosClient.post("/api/users/vouchers", { voucherCode: code });
            setSavedVouchers(res.data);
            alert("Lưu voucher thành công!");
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi khi lưu voucher.");
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset page về 1 khi search
        if (searchInput.trim()) {
            setSearchParams({ search: searchInput });
        } else {
            setSearchParams({});
        }
    };

    if (loadingShop) return <div style={{ textAlign: "center", padding: 80 }}>Đang tải thông tin cửa hàng...</div>;
    if (!shop) return <div style={{ textAlign: "center", padding: 80 }}>Không tìm thấy cửa hàng này!</div>;

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
            <div className="container" style={{ padding: "40px 0" }}>

                {/* 1. Shop Banner / Thông tin tổng quan */}
                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", display: "flex", boxShadow: "var(--shadow-sm)", marginBottom: 24 }}>
                    <div style={{ padding: 32, background: "linear-gradient(to right, var(--primary), var(--primary-light))", color: "#fff", width: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#fff", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: 16 }}>
                            <FaStore />
                        </div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 8px 0", textAlign: "center" }}>{shop.shopName}</h1>
                        <p style={{ opacity: 0.9, textAlign: "center", margin: 0, fontSize: "0.9rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{shop.shopDescription || "Cửa hàng uy tín trên Shopee Mini"}</p>
                    </div>

                    <div style={{ flex: 1, padding: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 40px", alignContent: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <FaBox style={{ color: "var(--text-light)", fontSize: "1.2rem" }} />
                            <div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Sản phẩm</div>
                                <div style={{ fontWeight: 700, color: "var(--primary)" }}>{shop.productCount}</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <FaStar style={{ color: "var(--text-light)", fontSize: "1.2rem" }} />
                            <div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Đánh giá</div>
                                <div style={{ fontWeight: 700, color: "var(--primary)" }}>{shop.rating} / 5.0 ({shop.reviewCount} Đánh giá)</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <FaCommentDots style={{ color: "var(--text-light)", fontSize: "1.2rem" }} />
                            <div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Ngày tham gia</div>
                                <div style={{ fontWeight: 700, color: "var(--primary)" }}>{new Date(shop.joinedAt).toLocaleDateString("vi-VN")}</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
                            <div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Uy tín Shop</div>
                                <div style={{ fontWeight: 700, color: "var(--primary)" }}>{shop.reputationScore} / 5 Điểm</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Voucher của Shop */}
                {shopVouchers.length > 0 && (
                    <div style={{ background: "#fff", padding: "24px 32px", borderRadius: 16, marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 16, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "var(--primary)" }}>🎫</span> Mã giảm giá của Shop
                        </h3>
                        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
                            {shopVouchers.map(v => {
                                const isSaved = savedVouchers.includes(v.code);
                                return (
                                    <div key={v._id} style={{ display: "flex", border: "1px solid var(--primary-light)", borderRadius: 8, overflow: "hidden", minWidth: 300, background: "var(--bg)" }}>
                                        <div style={{ background: "var(--primary)", color: "#fff", padding: "16px 12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: 90 }}>
                                            <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{v.type === "percentage" ? `${v.value}%` : `-${v.value/1000}k`}</div>
                                            <div style={{ fontSize: "0.7rem", marginTop: 4, textAlign: "center" }}>Giảm</div>
                                        </div>
                                        <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
                                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>{v.name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: 4 }}>Đơn tối thiểu {fmt(v.minOrderValue)}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>HSD: {new Date(v.endDate).toLocaleDateString("vi-VN")}</div>
                                            <button
                                                onClick={() => handleSaveVoucher(v.code)}
                                                style={{ position: "absolute", right: 16, bottom: "50%", transform: "translateY(50%)", padding: "6px 16px", background: isSaved ? "#f1f5f9" : "var(--primary)", border: isSaved ? "1px solid var(--line)" : "none", color: isSaved ? "var(--text-light)" : "#fff", borderRadius: 4, fontWeight: 700, fontSize: "0.8rem", cursor: isSaved ? "default" : "pointer" }}
                                                disabled={isSaved}
                                            >
                                                {isSaved ? "Đã lưu" : "Lưu"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. Thanh lọc / Tìm kiếm trong Shop */}
                <div style={{ background: "#fff", padding: "16px 24px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                        {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : "Tất cả sản phẩm"}
                    </div>

                    <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", background: "#f8fafc", borderRadius: 24, padding: "4px 16px", border: "1px solid var(--line)", width: 400 }}>
                        <input
                            type="text"
                            placeholder="Tìm kiếm trong Shop này..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            style={{ flex: 1, border: "none", background: "transparent", outline: "none", padding: "8px 0" }}
                        />
                        <button type="submit" style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 8 }}>
                            <FaSearch />
                        </button>
                    </form>
                </div>

                {/* 3. Danh sách sản phẩm của Shop */}
                {loadingProducts ? (
                    <div style={{ textAlign: "center", padding: 40 }}>Đang tải sản phẩm...</div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16 }}>
                        <h3 style={{ color: "var(--text-light)" }}>Không tìm thấy sản phẩm nào trong shop.</h3>
                        {searchQuery && <button className="btn btn-outline" onClick={() => { setSearchInput(""); setSearchParams({}); }} style={{ marginTop: 16 }}>Xóa tìm kiếm</button>}
                    </div>
                ) : (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
                            {products.map(p => {
                                const hasDiscount = p.category !== "groceries" && p.category !== "skincare";
                                const pct = hasDiscount ? Math.floor(Math.random() * 20) + 10 : 0;
                                const fp = p.price * (1 - pct / 100);
                                return (
                                    <div
                                        key={p._id}
                                        className="pCard"
                                        onClick={() => navigate(`/product/${p._id}`)}
                                        style={{ cursor: "pointer", background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "all 0.2s" }}
                                    >
                                        <div className="pWrap">
                                            <div className="pImg" style={{ height: 200 }}>
                                                {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : <span style={{ fontSize: 40, opacity: 0.15 }}>📦</span>}
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

                        {/* Phân trang */}
                        {totalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{ padding: "8px 16px", borderRadius: 8 }}
                                >
                                    Trước
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`btn ${page === i + 1 ? "btn-primary" : "btn-outline"}`}
                                        onClick={() => setPage(i + 1)}
                                        style={{ width: 40, padding: 8, borderRadius: 8 }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{ padding: "8px 16px", borderRadius: 8 }}
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </>
                )}

            </div>
            <ShopeeFooter />
        </div>
    );
}
