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

