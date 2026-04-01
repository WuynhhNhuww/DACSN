import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ShopeeFooter from "../components/ShopeeFooter";

const LS_KEY = "shopee_mini_cart";

const formatVND = (n) => `₫${Number(n || 0).toLocaleString("vi-VN")}`;

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  // load cart from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    setItems(raw ? JSON.parse(raw) : []);
  }, []);

  // save cart to localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }, [items]);

  const shippingFee = useMemo(() => {
    // demo: đơn >= 199k freeship
    return subtotal >= 199000 || subtotal === 0 ? 0 : 15000;
  }, [subtotal]);

  const total = subtotal + shippingFee;

  const inc = (id) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.min(99, it.qty + 1) } : it
      )
    );
  };

  const dec = (id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it))
    );
  };

  const remove = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const clearCart = () => setItems([]);

  return (
    <div style={{ background: "#f5f5f5", paddingBottom: 30 }}>
      <div className="container" style={{ marginTop: 20 }}>
        <div className="cartTitleRow">
          <h2>Giỏ hàng</h2>
          {items.length > 0 && (
            <button className="linkBtn" onClick={clearCart}>
              Xóa hết
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="cartEmpty shadow">
            <div className="cartEmptyIcon">🛒</div>
            <div className="cartEmptyText">Giỏ hàng của bạn đang trống</div>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className="cartGrid">
            {/* LEFT: items */}
            <div className="cartLeft">
              <div className="cartHeader shadow">
                <div>Sản phẩm</div>
                <div>Đơn giá</div>
                <div>Số lượng</div>
                <div>Số tiền</div>
                <div></div>
              </div>

              {items.map((it) => (
                <div className="cartItem shadow" key={it.id}>
                  <div className="cartProd" onClick={() => navigate(`/product/${it.id}`)}>
                    <div className="cartImg" />
                    <div className="cartName">{it.name}</div>
                  </div>

                  <div className="cartPrice">{formatVND(it.price)}</div>

                  <div className="cartQty">
                    <button onClick={() => dec(it.id)}>-</button>
                    <span>{it.qty}</span>
                    <button onClick={() => inc(it.id)}>+</button>
                  </div>

                  <div className="cartLineTotal">{formatVND(it.price * it.qty)}</div>

                  <button className="cartRemove" onClick={() => remove(it.id)}>
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            {/* RIGHT: summary */}
            <div className="cartRight">
              <div className="cartSummary shadow">
                <div className="sumTitle">Tổng thanh toán</div>

                <div className="sumRow">
                  <span>Tạm tính</span>
                  <b>{formatVND(subtotal)}</b>
                </div>

                <div className="sumRow">
                  <span>Phí vận chuyển</span>
                  <b>{formatVND(shippingFee)}</b>
                </div>

                <div className="sumDivider" />

                <div className="sumRow sumTotal">
                  <span>Tổng cộng</span>
                  <b>{formatVND(total)}</b>
                </div>

                <button className="btn btn-primary sumBtn">
                  Mua hàng
                </button>

                <div className="sumHint">
                  * Demo UI. Sau này nối backend sẽ gọi API tạo Order.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ShopeeFooter />
    </div>
  );
}