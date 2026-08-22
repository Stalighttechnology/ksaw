import univLogo from "@/assets/akkamahadevi-logo.jpeg.asset.json";
import govLogo from "@/assets/karnataka-govt-logo.png";

export function SiteHeader() {
  return (
    <header className="kk-header">
      <div className="kk-wrap kk-header-in">
        <div className="kk-logo">
          <img src={govLogo} alt="Government of Karnataka emblem" width={45} height={45} />
          <img src={univLogo.url} alt="Karnataka State Akkamahadevi Women's University logo" width={45} height={45} />
        </div>
        <p className="kk-header-title">KARNATAKA STATE AKKAMAHADEVI WOMENS UNIVERSITY</p>
        <div className="kk-logo kk-header-spacer" aria-hidden />
      </div>
    </header>
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
