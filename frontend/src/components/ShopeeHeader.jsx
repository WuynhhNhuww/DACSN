import { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaFacebook, FaInstagram, FaSearch, FaShoppingCart,
  FaQuestionCircle, FaGlobe, FaUserCircle,
  FaStore, FaBox, FaSignOutAlt, FaUser, FaChevronDown, FaHeart, FaMagic
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import NotificationDropdown from "./NotificationDropdown";
import MessageIcon from "./MessageIcon";
import socket from "../utils/socket";

export default function ShopeeHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext) || {};
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchingAI, setSearchingAI] = useState(false);
  const dropdownRef = useRef(null);
  const [buyerBadges, setBuyerBadges] = useState({ orders: 0, cart: 0, wishlist: 0 });

  const loadCart = async () => {
    if (user) {
      try {
        const res = await axiosClient.get("/api/cart");
        const data = res.data?.items || [];
        setCartCount(data.reduce((s, x) => s + (x.quantity || 0), 0));
      } catch { }
    } else {
      const raw = localStorage.getItem("wpn_store_cart");
      const cart = raw ? JSON.parse(raw) : [];
      setCartCount(cart.reduce((s, x) => s + (x.qty || 0), 0));
    }
  };

    useEffect(() => {
        loadCart();
        window.addEventListener("storage", loadCart);
        window.addEventListener("cart:updated", loadCart);

        const fetchBadges = () => {
            if (user && user.role === "buyer") {
                axiosClient.get("/api/badges/buyer")
                    .then(res => {
                        setBuyerBadges(res.data);
                        setCartCount(res.data.cart);
                    })
                    .catch(console.error);
            }
        };
        fetchBadges();

        socket.on("buyer_badge_update", fetchBadges);

        return () => {
            window.removeEventListener("storage", loadCart);
            window.removeEventListener("cart:updated", loadCart);
            socket.off("buyer_badge_update", fetchBadges);
        };
    }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const handleAISearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setSearchingAI(true);
    try {
        const res = await axiosClient.post("/api/ai/search", { query: search.trim() });
        const { params } = res.data;
        
        let url = `/products?search=${params.name || ""}`;
        if (params.category) url += `&category=${params.category}`;
        if (params.minPrice) url += `&minPrice=${params.minPrice}`;
        if (params.maxPrice) url += `&maxPrice=${params.maxPrice}`;
        if (params.sort) url += `&sort=${params.sort}`;
        
        navigate(url);
    } catch (err) {
        // Fallback to normal search
        navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    } finally {
        setSearchingAI(false);
    }
  };

  const handleLogout = () => {
    logout?.();
    setShowDropdown(false);
    navigate("/login");
  };

  const roleDashboard = () => {
    if (user?.role === "seller") return "/seller/dashboard";
    if (user?.role === "admin") return "/admin/dashboard";
    return "/buyer/profile";
  };

  return (
    <>
      {/* TOP BAR */}
      <div className="topbar">
        <div className="container">
          <div className="row">
            <div className="left">
              <Link to="/seller/dashboard" className="link"><FaStore /> Sell on WPN</Link>
              <span className="divider">|</span>
              <a className="link" href="#">Help & Support</a>
            </div>
            <div className="right">
              {user && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MessageIcon />
                  <NotificationDropdown />
                </div>
              )}
              <span className="divider">|</span>
              <a className="link" href="#"><FaGlobe /> English</a>
              <span className="divider">|</span>
              {!user ? (
                <>
                  <Link to="/register" className="link" style={{ fontWeight: 600 }}>Sign Up</Link>
                  <span className="divider">|</span>
                  <Link to="/login" className="link" style={{ fontWeight: 600 }}>Login</Link>
                </>
              ) : (
                <span style={{ opacity: .9, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                  <FaUserCircle size={16} /> Xin chào, {user.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <div className="header">
        <div className="container">
          <div className="headerMain">
            {/* LOGO */}
            <Link to="/home" className="logo">
              <div className="logoMark">W</div>
              <span>WPN STORE</span>
            </Link>

            {/* SEARCH */}
            {(location.pathname === "/home" || location.pathname === "/login") && (
              <div style={{ flex: 1, maxWidth: 600 }}>
                <form onSubmit={handleSearch}>
                  <div className="searchBox">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products, brands, and more..."
                    />
                    <button type="submit" title="Search"><FaSearch /></button>
                    <button 
                      type="button" 
                      onClick={handleAISearch} 
                      title="AI Smart Search" 
                      disabled={searchingAI}
                      style={{ 
                          background: "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)",
                          borderLeft: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "0 2px 2px 0",
                          width: 50,
                          position: "relative"
                      }}
                    >
                      {searchingAI ? <div className="spinner-small" /> : <FaMagic size={14} />}
                    </button>
                  </div>
                </form>
                <div className="suggestions">
                  {["Laptops", "Smartphones", "Fragrances", "Groceries", "Skincare", "Home Decor"].map(s => (
                    <a key={s} onClick={() => { setSearch(s); navigate(`/products?search=${s}`); }}>{s}</a>
                  ))}
                </div>
              </div>
            )}

            {/* RIGHT ACTIONS */}
            <div className="headerRight">
              {user?.role !== "seller" && user?.role !== "admin" && (
                <Link to="/buyer/cart" className="cartBtn" title="Shopping Cart">
                  <FaShoppingCart />
                  {cartCount > 0 && <span className="badge">{cartCount > 99 ? "99+" : cartCount}</span>}
                </Link>
              )}

              {user ? (
                <div className="headerUserMenu" ref={dropdownRef}>
                  <button
                    className="headerUserBtn"
                    onClick={() => setShowDropdown(v => !v)}
                  >
                    <FaUserCircle size={18} />
                    <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Xin chào, {user.name}
                    </span>
                    <FaChevronDown size={11} />
                  </button>
                  {showDropdown && (
                    <div className="headerDropdown" style={{ borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
                      <Link to={roleDashboard()} onClick={() => setShowDropdown(false)}>
                        <FaUser style={{ marginRight: 8 }} /> Tài khoản của tôi
                      </Link>
                      {user.role === "seller" && (
                        <Link to="/seller/dashboard" onClick={() => setShowDropdown(false)}>
                          <FaStore style={{ marginRight: 8 }} /> Kênh Người Bán
                        </Link>
                      )}
                      <Link to="/buyer/orders" onClick={() => setShowDropdown(false)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center" }}><FaBox style={{ marginRight: 8 }} /> Đơn mua của tôi</div>
                        {buyerBadges.orders > 0 && <span className="badge-mini" style={{ background: "var(--accent)", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{buyerBadges.orders}</span>}
                      </Link>
                      <Link to="/buyer/wishlist" onClick={() => setShowDropdown(false)}>
                        <FaHeart style={{ marginRight: 8, color: "var(--accent)" }} /> Yêu thích
                      </Link>
                      <div className="divider" style={{ margin: 0 }} />
                      <button onClick={handleLogout} style={{ color: "var(--accent)" }}>
                        <FaSignOutAlt style={{ marginRight: 8 }} /> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="headerUserBtn">
                  <FaUserCircle size={18} /> Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}