import { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaFacebook, FaInstagram, FaSearch, FaShoppingCart,
  FaQuestionCircle, FaGlobe, FaUserCircle,
  FaStore, FaBox, FaSignOutAlt, FaUser, FaChevronDown, FaHeart,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import NotificationDropdown from "./NotificationDropdown";

export default function ShopeeHeader() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext) || {};
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
    return () => {
      window.removeEventListener("storage", loadCart);
      window.removeEventListener("cart:updated", loadCart);
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
              {user && <NotificationDropdown />}
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
                  <FaUserCircle size={16} /> {user.name}
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
            <Link to="/" className="logo">
              <div className="logoMark">W</div>
              <span>WPN STORE</span>
            </Link>

            {/* SEARCH */}
            <div>
              <form onSubmit={handleSearch}>
                <div className="searchBox">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products, brands, and more..."
                  />
                  <button type="submit" title="Search"><FaSearch /></button>
                </div>
              </form>
              <div className="suggestions">
                {["Laptops", "Smartphones", "Fragrances", "Groceries", "Skincare", "Home Decor"].map(s => (
                  <a key={s} onClick={() => { setSearch(s); navigate(`/products?search=${s}`); }}>{s}</a>
                ))}
              </div>
            </div>

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
                      {user.name}
                    </span>
                    <FaChevronDown size={11} />
                  </button>
                  {showDropdown && (
                    <div className="headerDropdown" style={{ borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
                      <Link to={roleDashboard()} onClick={() => setShowDropdown(false)}>
                        <FaUser style={{ marginRight: 8 }} /> My Account
                      </Link>
                      {user.role === "seller" && (
                        <Link to="/seller/dashboard" onClick={() => setShowDropdown(false)}>
                          <FaStore style={{ marginRight: 8 }} /> Seller Center
                        </Link>
                      )}
                      <Link to="/buyer/orders" onClick={() => setShowDropdown(false)}>
                        <FaBox style={{ marginRight: 8 }} /> My Orders
                      </Link>
                      <Link to="/buyer/wishlist" onClick={() => setShowDropdown(false)}>
                        <FaHeart style={{ marginRight: 8, color: "var(--accent)" }} /> My Wishlist
                      </Link>
                      <div className="divider" style={{ margin: 0 }} />
                      <button onClick={handleLogout} style={{ color: "var(--accent)" }}>
                        <FaSignOutAlt style={{ marginRight: 8 }} /> Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="headerUserBtn">
                  <FaUserCircle size={18} /> Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}