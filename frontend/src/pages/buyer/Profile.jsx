import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaEdit, FaSave, FaStore, FaSignOutAlt, FaShoppingBag, FaCartPlus } from "react-icons/fa";
import axiosClient from "../../api/axiosClient";
import { AuthContext } from "../../context/AuthContext";
import ShopeeFooter from "../../components/ShopeeFooter";

export default function Profile() {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext) || {};
    const [form, setForm] = useState({ name: "", email: "" });
    const [editing, setEditing] = useState(false);
    const [msg, setMsg] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        setForm({ name: user.name || "", email: user.email || "" });
    }, [user, navigate]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosClient.put("/api/users/profile", { name: form.name });
            setMsg("Profile updated successfully!");
            setEditing(false);
        } catch {
            setMsg("Update failed. Please try again.");
        } finally {
            setSaving(false);
            setTimeout(() => setMsg(""), 3000);
        }
    };

    const handleBecomeSeller = async () => {
        if (!window.confirm("Do you want to apply to become a Seller on WPN Store?")) return;
        try {
            await axiosClient.put("/api/users/become-seller");
            setMsg("Application sent. Please wait for Admin approval.");
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            setMsg(err?.response?.data?.message || "Error applying for seller account.");
            setTimeout(() => setMsg(""), 3000);
        }
    };

    if (!user) return null;

    const roleLabel = { buyer: "Buyer", seller: "Seller", admin: "Administrator" };

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 80 }}>
            <div className="container" style={{ paddingTop: 40, maxWidth: 640 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>My Profile</h1>

                <div className="card" style={{ padding: 40, borderRadius: 32, boxShadow: "var(--shadow-sm)", background: "#fff" }}>
                    {/* Avatar Section */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 32, borderBottom: "1px solid var(--line)", marginBottom: 32 }}>
                        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", display: "grid", placeItems: "center", fontSize: 40, color: "#fff", fontWeight: 900, marginBottom: 16, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}>
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 24, color: "var(--text)" }}>{user.name}</div>
                        <div style={{ fontSize: 13, marginTop: 8, padding: "6px 16px", borderRadius: 12, background: "var(--primary-light)", color: "var(--primary)", fontWeight: 700, letterSpacing: "0.02em" }}>
                            {roleLabel[user.role] || user.role}
                        </div>
                    </div>

                    {msg && (
                        <div className={`alert ${msg.includes("failed") ? "alert-error" : "alert-success"}`} style={{ borderRadius: 16, marginBottom: 24, padding: "12px 20px", fontWeight: 600 }}>
                            {msg}
                        </div>
                    )}

                    <div className="formGroup" style={{ marginBottom: 24 }}>
                        <label className="formLabel" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-light)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                            <FaUser size={14} /> Full Name
                        </label>
                        {editing ? (
                            <input className="formControl" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus style={{ borderRadius: 12, padding: "12px 16px" }} />
                        ) : (
                            <div style={{ padding: "14px 20px", background: "var(--bg)", borderRadius: 16, border: "1.5px solid var(--line)", fontWeight: 600, color: "var(--text)" }}>{form.name}</div>
                        )}
                    </div>

                    <div className="formGroup" style={{ marginBottom: 32 }}>
                        <label className="formLabel" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-light)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                            <FaEnvelope size={14} /> Email Address
                        </label>
                        <div style={{ padding: "14px 20px", background: "var(--bg)", borderRadius: 16, border: "1.5px solid var(--line)", color: "var(--text-lighter)", fontWeight: 500 }}>{form.email}</div>
                        <span style={{ fontSize: 12, color: "var(--text-lighter)", marginTop: 8, display: "block" }}>Email cannot be modified.</span>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        {editing ? (
                            <>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: "12px 24px", borderRadius: 12, fontWeight: 700, flex: 1 }}>
                                    <FaSave style={{ marginRight: 8 }} /> {saving ? "Saving..." : "Save Changes"}
                                </button>
                                <button className="btn" onClick={() => setEditing(false)} style={{ padding: "12px 24px", borderRadius: 12, fontWeight: 700, background: "var(--bg)", border: "1px solid var(--line)" }}>Cancel</button>
                            </>
                        ) : (
                            <button className="btn btn-outline" onClick={() => setEditing(true)} style={{ padding: "12px 24px", borderRadius: 12, fontWeight: 700, border: "2px solid var(--primary)", color: "var(--primary)", width: "100%" }}>
                                <FaEdit style={{ marginRight: 8 }} /> Edit Profile
                            </button>
                        )}
                    </div>

                    {user.role === "buyer" && user.sellerStatus === "pending" && (
                        <div style={{ marginTop: 24, padding: "16px", background: "rgba(245, 158, 11, 0.1)", color: "#b45309", borderRadius: 16, border: "1px dashed #f59e0b", fontSize: 14, textAlign: "center", fontWeight: 500 }}>
                            Your Seller application is <strong>Pending Approval</strong>.<br />
                            We will notify you soon.
                        </div>
                    )}

                    {user.role === "buyer" && (!user.sellerStatus || user.sellerStatus === "inactive" || user.sellerStatus === "rejected") && (
                        <div style={{ marginTop: 24 }}>
                            <button className="btn" style={{ width: "100%", background: "#fff", border: "2px dashed var(--primary)", color: "var(--primary)", padding: "14px", borderRadius: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={handleBecomeSeller}>
                                <FaStore /> Become a Seller
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick links */}
                <div className="card" style={{ marginTop: 24, padding: 32, borderRadius: 32, boxShadow: "var(--shadow-sm)", background: "#fff" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Account Activity</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                            { icon: <FaShoppingBag />, label: "My Orders", path: "/buyer/orders" },
                            { icon: <FaCartPlus />, label: "Shopping Bag", path: "/buyer/bag" },
                        ].map(item => (
                            <div key={item.path}
                                onClick={() => navigate(item.path)}
                                style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", borderRadius: 16, cursor: "pointer", transition: "all 0.2s", color: "var(--text)" }}
                                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--primary)"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text)"; }}
                            >
                                <span style={{ fontSize: 18, color: "var(--primary)" }}>{item.icon}</span>
                                <span style={{ flex: 1, fontWeight: 600 }}>{item.label}</span>
                                <FaChevronRight size={12} style={{ opacity: 0.3 }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
                        <button className="btn" style={{ width: "100%", background: "rgba(239, 68, 68, 0.05)", color: "var(--accent)", border: "none", padding: "14px", borderRadius: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={() => { logout?.(); navigate("/login"); }}>
                            <FaSignOutAlt /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
            <ShopeeFooter />
        </div>
    );
}
