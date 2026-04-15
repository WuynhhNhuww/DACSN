import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaBolt, FaTicketAlt, FaShippingFast, FaStore, FaCoins, FaGift, FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";
import axiosClient from "../api/axiosClient";
import ShopeeFooter from "./ShopeeFooter";

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

// Map category sang icon & màu sắc phù hợp với DummyJSON categories
const CATEGORY_MAP = {
  smartphones: { icon: "📱", label: "Điện thoại", color: "#e0e7ff" },
  laptops: { icon: "💻", label: "Laptop", color: "#dcfce7" },
  fragrances: { icon: "🌸", label: "Nước hoa", color: "#fce7f3" },
  skincare: { icon: "✨", label: "Dưỡng da", color: "#fef3c7" },
  groceries: { icon: "🛒", label: "Thực phẩm", color: "#d1fae5" },
  "home-decoration": { icon: "🏡", label: "Trang trí nhà", color: "#ede9fe" },
  furniture: { icon: "🛋️", label: "Nội thất", color: "#fef9c3" },
  tops: { icon: "👕", label: "Thời trang", color: "#fee2e2" },
  "womens-bags": { icon: "👜", label: "Túi xách", color: "#fce7f3" },
  "womens-shoes": { icon: "👠", label: "Giày nữ", color: "#ffe4e6" },
  "mens-shirts": { icon: "👔", label: "Áo nam", color: "#dbeafe" },
  "mens-shoes": { icon: "👟", label: "Giày nam", color: "#d1fae5" },
  "mens-watches": { icon: "⌚", label: "Đồng hồ nam", color: "#f3f4f6" },
  "womens-watches": { icon: "⌚", label: "Đồng hồ nữ", color: "#fce7f3" },
  "womens-jewellery": { icon: "💍", label: "Trang sức", color: "#fef3c7" },
  "sunglasses": { icon: "🕶️", label: "Kính mát", color: "#e0e7ff" },
  "automotive": { icon: "🚗", label: "Ô tô", color: "#d1fae5" },
  "motorcycle": { icon: "🏍️", label: "Xe máy", color: "#fee2e2" },
  "lighting": { icon: "💡", label: "Đèn", color: "#fef9c3" },
};

const getCatInfo = (cat) =>
  CATEGORY_MAP[cat] || { icon: "🛍️", label: cat.replace(/-/g, " "), color: "#f1f5f9" };

const SLIDES = [
  {
    bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    title: "WPN STORE",
    sub: "Mua sắm thả ga — Giá tốt mỗi ngày",
    badge: "🔥 Hôm nay giảm đến 50%",
  },
  {
    bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    title: "FLASH SALE",
    sub: "Hàng ngàn sản phẩm ưu đãi sốc",
    badge: "⚡ Giới hạn thời gian",
  },
  {
    bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    title: "MIỄN PHÍ VẬN CHUYỂN",
    sub: "Đơn hàng từ 500.000₫ trở lên",
    badge: "🚚 Toàn quốc",
  },
];

const SHORTCUTS = [
  { icon: <FaBolt />, label: "Deal Hot", path: "/products?sort=popular" },
  { icon: <FaTicketAlt />, label: "Voucher", path: "/products" },
  { icon: <FaShippingFast />, label: "Freeship", path: "/products" },
  { icon: <FaStore />, label: "WPN Mall", path: "/products" },
  { icon: <FaCoins />, label: "Tích xu", path: "/buyer/wallet" },
  { icon: <FaGift />, label: "Quà tặng", path: "/products" },
];

export default function Home() {
  const navigate = useNavigate();
  const [flashProducts, setFlashProducts] = useState([]);
  const [todayProducts, setTodayProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const timerRef = useRef(null);

  // Auto-play slides
  useEffect(() => {
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  const goSlide = (dir) => {
    setSlide(s => (s + dir + SLIDES.length) % SLIDES.length);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000);
  };

  // Fetch data
  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          axiosClient.get("/api/products/categories"),
          axiosClient.get("/api/products?limit=30"),
        ]);
        setCategories(catRes.data || []);
        const prods = prodRes.data?.products || prodRes.data || [];
        setFlashProducts(prods.slice(0, 6));
        setTodayProducts(prods.slice(6));
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* HERO */}
      <div className="hero">
        <div className="container">
          <div className="heroGrid">
            {/* SLIDER */}
            <div className="slider" style={{ background: SLIDES[slide].bg, transition: "background 0.6s" }}>
              <div style={{ textAlign: "center", color: "#fff", padding: "0 40px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "4px 14px", borderRadius: 999, marginBottom: 12 }}>
                  {SLIDES[slide].badge}
                </div>
                <div className="slideText">{SLIDES[slide].title}</div>
                <div className="slideSub">{SLIDES[slide].sub}</div>
                <button
                  onClick={() => navigate("/products")}
                  style={{ marginTop: 16, padding: "10px 28px", borderRadius: 999, background: "#fff", color: "#333", fontWeight: 700, border: 0, cursor: "pointer", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                >
                  Mua ngay →
                </button>
              </div>
              <button className="slideBtn slideLeft" onClick={() => goSlide(-1)}><FaChevronLeft size={14} /></button>
              <button className="slideBtn slideRight" onClick={() => goSlide(1)}><FaChevronRight size={14} /></button>
              <div className="dots">
                {SLIDES.map((_, i) => (
                  <div key={i} className={`dot ${slide === i ? "active" : ""}`} onClick={() => setSlide(i)} />
                ))}
              </div>
            </div>

            {/* SIDE BANNERS */}
            <div className="heroSide">
              <div className="bannerSmall" style={{ background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)", cursor: "pointer" }} onClick={() => navigate("/products?sort=popular")}>
                <div className="tag">🔥 HOT DEAL</div>
                <div className="txt" style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Giảm đến 50%</div>
              </div>
              <div className="bannerSmall" style={{ background: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)", cursor: "pointer" }} onClick={() => navigate("/products")}>
                <div className="tag" style={{ background: "#4f46e5" }}>📦 FREESHIP</div>
                <div className="txt" style={{ color: "#1e293b", fontWeight: 800, fontSize: 15 }}>Từ 500.000₫</div>
              </div>
            </div>
          </div>

          {/* SHORTCUTS */}
          <div className="shortcuts" style={{ marginTop: 14 }}>
            {SHORTCUTS.map(s => (
              <div key={s.label} className="shortcut" onClick={() => navigate(s.path)}>
                <div className="shortcutIcon">{s.icon}</div>
                <div>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="section">
        <div className="container">
          <div className="blockTitle">DANH MỤC SẢN PHẨM</div>
          <div className="blockBody">
            {loading ? (
              <div className="categories">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="cat" style={{ animation: "pulse 1.5s infinite", background: "#f1f5f9" }}>
                    <div className="catCircle" />
                    <div style={{ height: 12, width: 60, background: "#e2e8f0", borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="categories" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 10)}, 1fr)` }}>
                {categories.slice(0, 10).map(cat => {
                  const info = getCatInfo(cat);
                  return (
                    <div
                      key={cat}
                      className="cat"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/products?category=${cat}`)}
                    >
                      <div className="catCircle" style={{ background: info.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                        {info.icon}
                      </div>
                      <div className="catName" style={{ textTransform: "capitalize" }}>{info.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FLASH SALE */}
      <div className="section">
        <div className="container">
          <div className="blockTitle">
            <div className="flashHeader">
              <span>⚡ FLASH SALE</span>
              <span className="flashBadge">🕐 HÔM NAY</span>
            </div>
            <span className="smallLink" style={{ cursor: "pointer" }} onClick={() => navigate("/products?sort=popular")}>
              Xem tất cả →
            </span>
          </div>
          <div className="blockBody">
            <div className="products" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
              {flashProducts.map(p => (
                <div key={p._id} className="pCard" onClick={() => navigate(`/product/${p._id}`)}>
                  <div className="pWrap">
                    <div className="pImg">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 40, opacity: 0.2 }}>📦</span>
                      }
                    </div>
                    {p.finalPrice && p.finalPrice < p.price && (
                      <div className="pTagSale">-{Math.round((1 - p.finalPrice / p.price) * 100)}%</div>
                    )}
                  </div>
                  <div className="pBody">
                    <div className="pName">{p.name}</div>
                    <div className="pRating" style={{ margin: "4px 0" }}>
                      {Array(5).fill(0).map((_, i) => (
                        <FaStar key={i} size={10} style={{ opacity: i < Math.round(p.ratingAvg || 0) ? 1 : 0.25, color: "#f59e0b" }} />
                      ))}
                      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>({p.ratingCount || 0})</span>
                    </div>
                    <div className="pPriceRow">
                      <div className="pPrice">{fmt(p.finalPrice ?? p.price)}</div>
                      <div className="pSold">{p.sold || 0} đã bán</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GỢI Ý HÔM NAY */}
      <div className="section" style={{ marginBottom: 40 }}>
        <div className="container">
          <div className="blockTitle">
            <span>🛍️ GỢI Ý HÔM NAY</span>
            <span className="smallLink" style={{ cursor: "pointer" }} onClick={() => navigate("/products")}>Xem thêm →</span>
          </div>
          <div className="blockBody">
            <div className="products">
              {todayProducts.slice(0, 12).map(p => (
                <div key={p._id} className="pCard" onClick={() => navigate(`/product/${p._id}`)}>
                  <div className="pImg">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 40, opacity: 0.2 }}>📦</span>
                    }
                  </div>
                  <div className="pBody">
                    <div className="pName">{p.name}</div>
                    <div className="pRating" style={{ margin: "4px 0" }}>
                      {Array(5).fill(0).map((_, i) => (
                        <FaStar key={i} size={10} style={{ opacity: i < Math.round(p.ratingAvg || 0) ? 1 : 0.25, color: "#f59e0b" }} />
                      ))}
                    </div>
                    <div className="pPriceRow">
                      <div className="pPrice">{fmt(p.finalPrice ?? p.price)}</div>
                      <div className="pSold">{p.sold || 0} đã bán</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/products")}
                style={{ padding: "12px 40px", borderRadius: 12, fontWeight: 700 }}
              >
                Xem thêm sản phẩm
              </button>
            </div>
          </div>
        </div>
      </div>

      <ShopeeFooter />
    </div>
  );
}