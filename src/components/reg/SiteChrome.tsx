export function SiteHeader() {
  return (
    <>
      <div className="kk-topbar">
        <div className="kk-wrap kk-topbar-in">
          <span className="kk-topbar-title">Karnataka Skill Development Corporation</span>
          <nav className="kk-topnav" aria-label="Utility">
            <a href="#">World Skill Registration</a>
            <a href="#">Career</a>
            <a href="#">E-Kaushalya</a>
            <a href="#">Certificate Verification</a>
            <a href="#">UNDP – Code Unnati</a>
          </nav>
        </div>
      </div>
      <header className="kk-header">
        <div className="kk-wrap kk-header-in">
          <div className="kk-logo">
            <img
              src="/images/header-logo.png"
              alt="Karnataka Skill Development Corporation, Department of Skill Development, Entrepreneurship and Livelihood"
            />
          </div>
          <nav className="kk-mainnav" aria-label="Main">
            <a href="#">Home</a>
            <a href="#">About Us</a>
            <a href="#">Programs</a>
            <a href="#">Resources</a>
            <a href="#">Registration</a>
            <a href="#">More</a>
            <a href="#">Login</a>
          </nav>
        </div>
      </header>
    </>
  );
}

export function PageBanner() {
  return (
    <section className="kk-banner">
      <div className="kk-wrap">
        <h1>Registration Form</h1>
        <p>
          For any clarifications please, email: <a href="mailto:info@kaushalkar.com">info@kaushalkar.com</a>
        </p>
      </div>
    </section>
  );
}

const USEFUL_LINKS = [
  "About us",
  "Disclaimer",
  "Privacy Policy",
  "Cookie Notice",
  "Gallery",
  "Site Map",
  "Contact Us",
  "Initiatives",
  "Skill.tube",
  "Shrama Samarthya",
  "IMC-K",
  "Partners",
  "CII",
  "UNDP",
  "Kaushalya Sampada",
];

export function SiteFooter() {
  return (
    <>
      <footer className="kk-footer">
        <div className="kk-wrap kk-footer-grid">
          <div>
            <img src="/images/footer-logo.png" alt="Kaushalya Karnataka" style={{ height: 64, width: "auto" }} />
            <strong>Address</strong>
            <p>Kaushalya Bhavan,</p>
            <p>3rd Floor, Dairy Circle, Bannerghatta Main Rd,</p>
            <p>Hombegowda Nagar,</p>
            <p>Bengaluru, Karnataka 560029</p>
            <strong>Helpline</strong>
            <p>080 2955 0555</p>
            <strong>Email</strong>
            <p>skilldev.2017@gmail.com</p>
          </div>
          <div>
            <h3>Useful links</h3>
            <div className="kk-footer-links">
              {USEFUL_LINKS.map((l) => (
                <a key={l} href="#">
                  {l}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3>Social Media</h3>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="#" aria-label="Facebook" className="kk-social">
                f
              </a>
              <a href="#" aria-label="Twitter" className="kk-social">
                t
              </a>
            </div>
          </div>
        </div>
      </footer>
      <div className="kk-copy">© 2026 By Karnataka Koushalya Mission. All Rights Reserved.</div>
    </>
  );
}
