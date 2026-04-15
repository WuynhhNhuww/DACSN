import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaShoppingCart, FaStore } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import ShopeeFooter from "../../components/ShopeeFooter";

const fmt = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const load = () => {
    if (user) {
      axiosClient.get("/api/cart")
        .then(res => {
          const data = res.data?.items || [];
          setItems(data.map(it => ({
            id: it.product?._id || it.product,
            cartId: it._id,
            name: it.name || it.product?.name,
            price: it.unitPrice || it.product?.price || 0,
            image: it.image || it.product?.images?.[0] || "",
            qty: it.quantity,
            seller: it.seller,
          })));
        })
        .catch(() => loadLocal())
        .finally(() => setLoading(false));
    } else {
      loadLocal();
      setLoading(false);
    }
  };

  const loadLocal = () => {
    const raw = localStorage.getItem("wpn_store_cart");
    setItems(raw ? JSON.parse(raw) : []);
  };

  useEffect(() => {
    if (user && (user.role === "seller" || user.role === "admin")) {
      navigate("/home");
      return;
    }
    load();
  }, [user]);

  const saveLocal = (newItems) => {
    localStorage.setItem("wpn_store_cart", JSON.stringify(newItems));
    window.dispatchEvent(new Event("cart:updated"));
  };

  const inc = (id) => {
    const updated = items.map(it => it.id === id ? { ...it, qty: Math.min(99, it.qty + 1) } : it);
    setItems(updated);
    saveLocal(updated);
  };

  const dec = (id) => {
    const updated = items.map(it => it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it);
    setItems(updated);
    saveLocal(updated);
  };

  const remove = async (id) => {
    if (user) {
      try { await axiosClient.delete(`/api/cart/${id}`); } catch { }
    }
    const updated = items.filter(it => it.id !== id);
    setItems(updated);
    setSelected(prev => prev.filter(x => x !== id));
    saveLocal(updated);
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selected.length === items.length && items.length > 0) setSelected([]);
    else setSelected(items.map(it => it.id));
  };

  const selectedItems = useMemo(() => items.filter(it => selected.includes(it.id)), [items, selected]);
  const subtotal = useMemo(() => selectedItems.reduce((s, it) => s + it.price * it.qty, 0), [selectedItems]);
  const shippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach(it => {
      const shopId = it.seller?._id || "unknown";
      if (!groups[shopId]) {
        groups[shopId] = {
          shopId,
          shopName: it.seller?.sellerInfo?.shopName || "Modern Partner",
          items: []
        };
      }
      groups[shopId].items.push(it);
    });
    return Object.values(groups);
  }, [items]);

  const handleCheckout = () => {
    if (selected.length === 0) return alert("Please select at least 1 item to checkout.");
    navigate("/buyer/checkout", { state: { selectedItems } });
  };

  if (loading) return <div className="loading" style={{ marginTop: 80 }}>Loading your essentials...</div>;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 60 }}>
      <div className="container">
        <div className="cartTitleRow" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 40, marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Shopping Bag <span style={{ fontSize: 16, fontWeight: 400, color: "var(--text-light)" }}>({items.length} items)</span></h1>
          {items.length > 0 && <button className="linkBtn" onClick={() => { if (window.confirm("Clear all items?")) { setItems([]); saveLocal([]); } }} style={{ color: "var(--accent)" }}>Clear all</button>}
        </div>

        {items.length === 0 ? (
          <div className="cartEmpty" style={{ background: "#fff", padding: 80, borderRadius: 24, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
            <div className="cartEmptyIcon" style={{ fontSize: 64, marginBottom: 24 }}>🛍️</div>
            <h2 style={{ marginBottom: 12 }}>Your bag is empty</h2>
            <p style={{ color: "var(--text-light)", marginBottom: 32 }}>Looks like you haven't added anything yet.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate("/products")} style={{ padding: "14px 40px", borderRadius: 12 }}>Start Shopping</button>
          </div>
        ) : (
          <div className="cartGrid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
            <div className="cartLeft">
              <div className="cartHeader" style={{ display: "grid", gridTemplateColumns: "40px 1fr 120px 120px 120px 40px", gap: 16, padding: "16px 24px", background: "#fff", borderRadius: "16px 16px 0 0", borderBottom: "1px solid var(--line)", fontWeight: 700, fontSize: 13, color: "var(--text-light)" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input type="checkbox" style={{ transform: "scale(1.2)", cursor: "pointer" }} checked={selected.length === items.length && items.length > 0} onChange={toggleSelectAll} />
                </div>
                <div>PRODUCT</div>
                <div style={{ textAlign: "right" }}>UNIT PRICE</div>
                <div style={{ textAlign: "center" }}>QTY</div>
                <div style={{ textAlign: "right" }}>TOTAL</div>
                <div />
              </div>

              {groupedItems.map(group => (
                <div key={group.shopId} className="cartShopGroup" style={{ background: "#fff", borderBottom: "1px solid var(--line)" }}>
                  <div className="cartShopHeader" style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", background: "#fcfcfd", display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={group.items.every(it => selected.includes(it.id))}
                      onChange={() => {
                        const groupIds = group.items.map(it => it.id);
                        if (group.items.every(it => selected.includes(it.id))) {
                          setSelected(prev => prev.filter(id => !groupIds.includes(id)));
                        } else {
                          setSelected(prev => Array.from(new Set([...prev, ...groupIds])));
                        }
                      }}
                    />
                    <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                      <FaStore style={{ color: "var(--primary)" }} /> {group.shopName}
                    </span>
                  </div>
                  {group.items.map(it => (
                    <div className="cartItem" key={it.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr 120px 120px 120px 40px", gap: 16, padding: "20px 24px", borderBottom: "1px solid #f8fafc", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <input type="checkbox" style={{ transform: "scale(1.2)", cursor: "pointer" }} checked={selected.includes(it.id)} onChange={() => toggleSelect(it.id)} />
                      </div>
                      <div className="cartProd" onClick={() => navigate(`/product/${it.id}`)} style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
                        <div className="cartImg" style={{ width: 80, height: 80, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#f1f5f9" }}>
                          {it.image ? <img src={it.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, opacity: .2, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>📦</span>}
                        </div>
                        <div className="cartName" style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4 }}>{it.name}</div>
                      </div>
                      <div className="cartPrice" style={{ textAlign: "right", fontWeight: 600 }}>{fmt(it.price)}</div>
                      <div className="cartQty" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
                          <button onClick={() => dec(it.id)} style={{ padding: "4px 10px", border: "none", background: "none", cursor: "pointer" }}>−</button>
                          <span style={{ padding: "4px 12px", borderLeft: "1px solid var(--line)", borderRight: "1px solid var(--line)", fontWeight: 700, fontSize: 13 }}>{it.qty}</span>
                          <button onClick={() => inc(it.id)} style={{ padding: "4px 10px", border: "none", background: "none", cursor: "pointer" }}>+</button>
                        </div>
                      </div>
                      <div className="cartLineTotal" style={{ textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>{fmt(it.price * it.qty)}</div>
                      <button className="cartRemove" onClick={() => remove(it.id)} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"} onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}>
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ background: "#fff", padding: 16, borderRadius: "0 0 16px 16px", boxShadow: "var(--shadow-sm)" }} />
            </div>

            <div className="cartRight">
              <div className="cartSummary" style={{ background: "#fff", padding: 32, borderRadius: 24, boxShadow: "var(--shadow-sm)", position: "sticky", top: 120 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Tóm tắt đơn hàng</h3>

                <div className="sumRow" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 15 }}>
                  <span style={{ color: "var(--text-light)" }}>Tổng phụ ({selectedItems.reduce((s, it) => s + it.qty, 0)} SP)</span>
                  <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
                </div>
                <div className="sumRow" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 15 }}>
                  <span style={{ color: "var(--text-light)" }}>Phí vận chuyển</span>
                  <span style={{ fontWeight: 600, color: shippingFee === 0 ? "#10b981" : "var(--text)" }}>
                    {shippingFee === 0 ? "MIỄN PHÍ" : fmt(shippingFee)}
                  </span>
                </div>
                {shippingFee > 0 && (
                  <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 500, marginBottom: 20, background: "var(--primary-light)", padding: "8px 12px", borderRadius: 8 }}>
                    Mua thêm {fmt(500000 - subtotal)} để được MIỄN PHÍ vận chuyển
                  </div>
                )}
                <div className="sumDivider" style={{ height: 1, background: "var(--line)", margin: "24px 0" }} />
                <div className="sumRow sumTotal" style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>Tổng cộng</span>
                  <span style={{ fontWeight: 800, fontSize: 24, color: "var(--primary)" }}>{fmt(total)}</span>
                </div>
                <button
                  className="btn sumBtn"
                  onClick={handleCheckout}
                  style={{
                    width: "100%", padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 16,
                    background: selected.length === 0 ? "#f1f5f9" : "var(--primary)",
                    color: selected.length === 0 ? "#94a3b8" : "#fff",
                    border: "none", cursor: selected.length === 0 ? "not-allowed" : "pointer"
                  }}
                  disabled={selected.length === 0}
                >
                  Tiến hành Thanh toán
                </button>
                <div className="sumHint" style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--text-lighter)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  Thanh toán an toàn bảo mật
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