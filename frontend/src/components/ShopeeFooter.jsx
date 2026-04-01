export default function ShopeeFooter() {
  return (
    <>
      {/* MAIN FOOTER */}
      <div className="footerMain" style={{ background: "#fff", borderTop: "1px solid var(--line)", paddingTop: 60, paddingBottom: 60 }}>
        <div className="container">
          <div className="footerGrid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 40 }}>
            <div className="footerCol">
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">WPN Blog</a>
              <a href="#">Buying Guide</a>
              <a href="#">Selling Guide</a>
              <a href="#">Contact Us</a>
            </div>

            <div className="footerCol">
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>WPN Store</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Affiliate Program</a>
            </div>

            <div className="footerCol">
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Payment Methods</h4>
              <div className="footerBadges">
                <div className="badgeBox">VISA</div>
                <div className="badgeBox">MC</div>
                <div className="badgeBox">COD</div>
                <div className="badgeBox">Apple Pay</div>
              </div>
            </div>

            <div className="footerCol">
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Follow Us</h4>
              <a href="#">Facebook</a>
              <a href="#">Instagram</a>
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
            </div>

            <div className="footerCol">
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Get the App</h4>
              <div className="qrRow">
                <div className="qr">QR</div>
                <div className="storeCol">
                  <div className="storeBtn">App Store</div>
                  <div className="storeBtn">Google Play</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="footerBottom" style={{ background: "#f8fafc", padding: "24px 0", borderTop: "1px solid var(--line)" }}>
        <div className="container">
          <div className="row" style={{ display: "flex", justifyContent: "space-between", color: "var(--text-light)", fontSize: 13 }}>
            <div>© 2026 WPN Store Ltd. All Rights Reserved.</div>
            <div>Region: Vietnam | English</div>
          </div>
        </div>
      </div>
    </>
  );
}