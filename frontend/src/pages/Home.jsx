import { useRef, useState, useEffect } from "react";
import {
  FaBolt, FaTicketAlt, FaShippingFast, FaStore, FaCoins, FaGift,
  FaChevronLeft, FaChevronRight, FaCheckCircle, FaUndo, FaArrowUp,
} from "react-icons/fa";
import ShopeeFooter from "../components/ShopeeFooter";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const fetchHomeData = async () => {
  try {
    const [prodRes, promoRes, bannerRes] = await Promise.all([
      axiosClient.get("/api/products?limit=30"),
      axiosClient.get("/api/promotions/active"),
      axiosClient.get("/api/banners/active")
    ]);

    const prods = prodRes.data.products || prodRes.data || [];
    const today = prods.map(p => ({ ...p, id: p._id, oldPrice: p.price * 1.2, salePercent: 15 }));
    const flash = promoRes.data?.data || [];
    const banners = bannerRes.data || [];

    return { flash, today, banners };
  } catch (err) {
    console.error("Lỗi lấy dữ liệu Home", err);
    return { flash: [], today: [], banners: [] };
  }
};

export default function Home() {
  const mallRef = useRef(null);
  const topRef = useRef(null);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [flashProducts, setFlashProducts] = useState([]);
  const [todayProducts, setTodayProducts] = useState([]);
  const [activeBanners, setActiveBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTop, setShowTop] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [visible, setVisible] = useState(12);

  const slides = [
    { id: 1, title: "EXQUISITE COLLECTION", sub: "Premium Tech & Lifestyle", bg: "slideBg1" },
    { id: 2, title: "MODERN ESSENTIALS", sub: "Curated for Your Daily Life", bg: "slideBg2" },
    { id: 3, title: "LIMITED OFFERS", sub: "Exclusive Deals on Top Brands", bg: "slideBg3" },
  ];

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [data, catRes] = await Promise.all([
        fetchHomeData(),
        axiosClient.get("/api/products/categories")
      ]);

      if (!mounted) return;
      setFlashProducts(data.flash);
      setTodayProducts(data.today);
      setActiveBanners(data.banners);
      setCategories(catRes.data || []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const hh = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const mm = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  const scrollRow = (ref, dir = 1) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 800, behavior: "smooth" });
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* HERO SECTION */}
      <div className="hero" style={{ padding: "24px 0" }}>
        <div className="container">
          <div className="heroGrid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
            <div className="slider shadow-lg" style={{ height: 380, borderRadius: 20 }}>
              {slides.map((s, i) => (
                <div key={s.id} className={`slide ${s.bg} ${i === slideIdx ? "active" : ""}`} style={{ borderRadius: 20 }}>
                  <h2 className="slideText" style={{ fontSize: 42 }}>{s.title}</h2>
                  <p className="slideSub" style={{ fontSize: 18, opacity: 0.9 }}>{s.sub}</p>
                </div>
              ))}
              <div className="dots">
                {slides.map((_, i) => (
                  <div key={i} className={`dot ${i === slideIdx ? "active" : ""}`} onClick={() => setSlideIdx(i)} />
                ))}
              </div>
            </div>

            <div className="heroSide" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {activeBanners.slice(0, 2).map((banner, i) => (
                <div key={i} className="bannerSmall shadow"
                  style={{ flex: 1, borderRadius: 16, background: `url(${banner.imageUrl}) center/cover` }}
                  onClick={() => navigate(banner.targetUrl)}
                />
              ))}
              {activeBanners.length < 2 && (
                <div className="bannerSmall shadow" style={{ flex: 1, borderRadius: 16, background: "linear-gradient(135deg, #4f46e5, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", padding: 20 }}>
                  <div style={{ textAlign: "center" }}>
                    <FaShippingFast size={32} style={{ marginBottom: 8 }} />
                    <div style={{ fontWeight: 700 }}>FREE SHIPPING</div>
                    <div style={{ fontSize: 12 }}>On All Orders Over 500k</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC CATEGORIES */}
      <div className="section">
        <div className="container">
          <div className="blockTitle" style={{ background: "transparent", borderBottom: "none", fontSize: 20, marginBottom: 12 }}>
            BROWSE BY CATEGORY
          </div>
          <div className="categories" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10 }}>
            {categories.map((c) => (
              <div key={c} className="cat"
                onClick={() => navigate(`/products?category=${c}`)}
                style={{ minWidth: 140, padding: "20px 12px", background: "#fff", borderRadius: 16, boxShadow: "var(--shadow-sm)" }}>
                <div className="catCircle" style={{ background: "var(--primary-light)", color: "var(--primary)", display: "grid", placeItems: "center", fontSize: 18 }}>
                  {c.charAt(0).toUpperCase()}
                </div>
                <div className="catName" style={{ marginTop: 8, fontSize: 13, textTransform: "capitalize" }}>{c.replace("-", " ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLASH SALE - Refined */}
      {flashProducts.length > 0 && (
        <div className="section">
          <div className="container">
            <div className="blockTitle" style={{ borderRadius: "16px 16px 0 0", borderBottom: "none", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ color: "var(--accent)", fontWeight: 800 }}>FLASH OFFERS</span>
                <span style={{ background: "var(--accent)", color: "#fff", padding: "4px 12px", borderRadius: 8 }}>{hh}:{mm}:{ss}</span>
              </div>
              <button className="linkBtn" onClick={() => navigate("/products")}>View All</button>
            </div>
            <div className="blockBody" style={{ borderRadius: "0 0 16px 16px", padding: 20 }}>
              <div className="products" style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: 20 }}>
                {flashProducts.map((fp) => (
                  <div key={fp.product?._id} className="pCard" onClick={() => navigate(`/product/${fp.product?._id}`)}>
                    <div className="pWrap">
                      <div className="pImg" style={{ height: 180 }}>
                        <img src={fp.product?.images?.[0]} alt="" />
                      </div>
                      <div className="pTagSale" style={{ background: "var(--accent)" }}>-{fp.discountValue}%</div>
                    </div>
                    <div className="pBody">
                      <div className="pName">{fp.product?.name}</div>
                      <div className="pPriceRow">
                        <div className="pPrice">{Math.round(fp.salePrice).toLocaleString()}₫</div>
                        <div className="pOldPrice">{Math.round(fp.product?.price).toLocaleString()}₫</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISCOVER PRODUCTS */}
      <div className="section">
        <div className="container">
          <div className="blockTitle" style={{ background: "transparent", borderBottom: "none", fontSize: 20, marginBottom: 12 }}>
            DISCOVER PRODUCTS
          </div>
          <div className="products" style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: 20 }}>
            {todayProducts.slice(0, visible).map((p) => (
              <div key={p._id} className="pCard" onClick={() => navigate(`/product/${p._id}`)}>
                <div className="pWrap">
                  <div className="pImg" style={{ height: 200 }}>
                    <img src={p.images?.[0]} alt="" />
                  </div>
                </div>
                <div className="pBody" style={{ padding: 16 }}>
                  <div className="pName" style={{ fontWeight: 600, height: 44, marginBottom: 8 }}>{p.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="pPrice" style={{ fontSize: 18 }}>{p.price.toLocaleString()}₫</div>
                    <div className="pSold" style={{ fontSize: 12 }}>{p.sold} sold</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {visible < todayProducts.length && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button className="btn btn-primary" style={{ padding: "12px 32px", borderRadius: 12 }} onClick={() => setVisible(v => v + 6)}>
                Load More
              </button>
            </div>
          )}
        </div>
      </div>

      {showTop && (
        <button className="backTop" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ background: "var(--primary)", color: "#fff", position: "fixed", bottom: 30, right: 30, width: 50, height: 50, borderRadius: "50%", border: "none", boxShadow: "var(--shadow-lg)", cursor: "pointer", zIndex: 100 }}>
          <FaArrowUp />
        </button>
      )}

      <ShopeeFooter />
    </div>
  );
}