import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import ShopeeFooter from "../components/ShopeeFooter";

const LS_KEY = "shopee_mini_cart";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // 🔥 Mock data (sau này nối backend)
  const product = {
    id,
    name: "Áo Thun Cotton Form Rộng Cao Cấp",
    price: 129000,
    oldPrice: 199000,
    salePercent: 35,
    sold: 4321,
    description:
      "Chất liệu cotton 100%, form rộng unisex, phù hợp đi học, đi chơi. Hàng chuẩn WNP Mall.",
    images: [
      "https://via.placeholder.com/400x400",
      "https://via.placeholder.com/400x400/ff7a63",
      "https://via.placeholder.com/400x400/ee4d2d",
      "https://via.placeholder.com/400x400/ffb300",
    ],
  };

  const [mainImg, setMainImg] = useState(product.images[0]);
  const [qty, setQty] = useState(1);

  const addToCart = () => {
    const raw = localStorage.getItem(LS_KEY);
    const cart = raw ? JSON.parse(raw) : [];

    const idx = cart.findIndex((x) => x.id === product.id);

    if (idx > -1) {
      cart[idx].qty = Math.min(99, cart[idx].qty + qty);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty,
      });
    }

    localStorage.setItem(LS_KEY, JSON.stringify(cart));

    // ✅ update badge ngay lập tức
    window.dispatchEvent(new Event("cart:updated"));

    navigate("/cart");
  };

  return (
    <div style={{ background: "#f5f5f5", paddingBottom: 40 }}>
      <div className="container" style={{ marginTop: 20 }}>
        <div className="pdWrap shadow">
          {/* LEFT IMAGES */}
          <div className="pdLeft">
            <div className="pdMainImg">
              <img src={mainImg} alt="" />
            </div>

            <div className="pdThumbRow">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className={`pdThumb ${mainImg === img ? "active" : ""}`}
                  onClick={() => setMainImg(img)}
                >
                  <img src={img} alt="" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT INFO */}
          <div className="pdRight">
            <h2 className="pdName">{product.name}</h2>

            <div className="pdSold">Đã bán {product.sold}</div>

            <div className="pdPriceBox">
              <span className="pdOldPrice">
                ₫{product.oldPrice.toLocaleString("vi-VN")}
              </span>
              <span className="pdPrice">
                ₫{product.price.toLocaleString("vi-VN")}
              </span>
              <span className="pdSaleTag">-{product.salePercent}%</span>
            </div>

            {/* Quantity */}
            <div className="pdQty">
              <span>Số lượng</span>
              <div className="pdQtyControl">
                <button onClick={() => setQty(qty > 1 ? qty - 1 : 1)}>-</button>
                <span>{qty}</span>
                <button onClick={() => setQty(qty + 1)}>+</button>
              </div>
            </div>

            <div className="pdActions">
              <button className="btn btn-outline" onClick={addToCart}>
                Thêm vào giỏ
              </button>
              <button className="btn btn-primary" onClick={addToCart}>
                Mua ngay
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pdDesc shadow">
          <h3>MÔ TẢ SẢN PHẨM</h3>
          <p>{product.description}</p>
        </div>
      </div>

      <ShopeeFooter />
    </div>
  );
}