import { useEffect, useState } from "react";
import { FaBolt, FaTicketAlt, FaShippingFast, FaStore, FaCoins, FaGift } from "react-icons/fa";

const categories = [
  "Thời Trang Nam", "Điện Thoại & Phụ Kiện", "Thiết Bị Điện Tử", "Máy Tính & Laptop", "Máy Ảnh & Máy Quay Phim",
  "Đồng Hồ", "Giày Dép Nam", "Thiết Bị Điện Gia Dụng", "Thể Thao & Du Lịch", "Ô Tô & Xe Máy",
];

import axiosClient from "../api/axiosClient";

/* ---------------- API FETCHING ---------------- */
const fetchHomeData = async () => {
  try {
    const res = await axiosClient.get("/api/products?limit=30");
    const prods = res.data.products || res.data || [];
    // Tính toán lại flashsale và today products:
    const flash = prods.slice(0, 6).map(p => ({
      id: p._id,
      name: p.name,
      price: p.finalPrice ?? p.price,
      oldPrice: p.price,
      salePercent: p.price > (p.finalPrice || p.price) ? Math.round((1 - (p.finalPrice || p.price) / p.price) * 100) : 0,
      sold: p.sold || 0,
      images: p.images || []
    }));
    const today = prods.slice(6).map(p => ({
      id: p._id,
      name: p.name,
      price: p.finalPrice ?? p.price,
      sold: p.sold || 0,
      images: p.images || []
    }));
    return { flash, today };
  } catch (err) {
    return { flash: [], today: [] };
  }
};

export default function Home() {
  const [flashProducts, setFlashProducts] = useState([]);
  const [todayProducts, setTodayProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchHomeData();
      if (!mounted) return;
      setFlashProducts(data.flash);
      setTodayProducts(data.today);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div className="container">
          <div className="heroGrid">
            <div className="slider shadow">
              <div className="sliderInner">MEGA SALE 3.3</div>
              <div className="sliderHint">Banner (demo) — sau này thay ảnh thật</div>
            </div>

            <div className="heroSide">
              <div className="bannerSmall shadow">
                <div className="tag">FREESHIP</div>
                <div className="txt">Nhận ưu đãi 0Đ</div>
              </div>
              <div className="bannerSmall shadow">
                <div className="tag">VOUCHER</div>
                <div className="txt">Giảm đến 50.000đ</div>
              </div>
            </div>
          </div>

          {/* SHORTCUTS */}
          <div style={{ marginTop: 14 }} className="shortcuts shadow">
            <div className="shortcut">
              <div className="shortcutIcon"><FaBolt /></div>
              <div>Deal Hot</div>
            </div>
            <div className="shortcut">
              <div className="shortcutIcon"><FaTicketAlt /></div>
              <div>Mã Giảm Giá</div>
            </div>
            <div className="shortcut">
              <div className="shortcutIcon"><FaShippingFast /></div>
              <div>Freeship</div>
            </div>
            <div className="shortcut">
              <div className="shortcutIcon"><FaStore /></div>
              <div>WNP Mall</div>
            </div>
            <div className="shortcut">
              <div className="shortcutIcon"><FaCoins /></div>
              <div>Hoàn Xu</div>
            </div>
            <div className="shortcut">
              <div className="shortcutIcon"><FaGift /></div>
              <div>Quà Tặng</div>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="section">
        <div className="container">
          <div className="blockTitle">DANH MỤC</div>
          <div className="blockBody">
            <div className="categories">
              {categories.map((c) => (
                <div key={c} className="cat">
                  <div className="catCircle" />
                  <div className="catName">{c}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FLASH SALE */}
      <div className="section">
        <div className="container">
          <div className="blockTitle">
            <div className="flashHeader">
              <div className="flashLeft">
                <span>FLASH SALE</span>
                <span className="flashBadge">CÒN 2 NGÀY</span>
              </div>
            </div>
            <a className="smallLink" href="#">Xem tất cả</a>
          </div>

          <div className="blockBody">
            <div className="products" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
              {flashProducts.map((p) => (
                <div key={p.id} className="pCard">
                  <div className="pWrap">
                    <div className="pImg">
                      {p.images?.[0] && <img src={p.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />}
                    </div>
                    {p.salePercent > 0 && <div className="pTagSale">-{p.salePercent}%</div>}
                  </div>
                  <div className="pBody">
                    <div className="pName">{p.name}</div>
                    <div className="pPriceRow">
                      <div className="pPrice">₫{(p.price || 0).toLocaleString("vi-VN")}</div>
                      <div className="pSold">{p.sold} đã bán</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TODAY */}
      <div className="section">
        <div className="container">
          <div className="blockTitle">
            <span>GỢI Ý HÔM NAY</span>
            <a className="smallLink" href="#">Xem thêm</a>
          </div>

          <div className="blockBody">
            <div className="products">
              {todayProducts.map((p) => (
                <div key={p.id} className="pCard">
                  <div className="pImg">
                    {p.images?.[0] && <img src={p.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />}
                  </div>
                  <div className="pBody">
                    <div className="pName">{p.name}</div>
                    <div className="pPriceRow">
                      <div className="pPrice">₫{(p.price || 0).toLocaleString("vi-VN")}</div>
                      <div className="pSold">{p.sold} đã bán</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <button className="btn btn-primary">Xem thêm</button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: 24, padding: "26px 0", background: "#fff", borderTop: "1px solid var(--line)" }}>
        <div className="container" style={{ color: "#666", fontSize: 13 }}>
          © 2026 WNP Mini (UI demo) — Màu chủ đạo: <b style={{ color: "#ee4d2d" }}>#ee4d2d</b>
        </div>
      </div>
    </div >
  );
}