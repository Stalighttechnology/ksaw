import univLogo from "@/assets/image.png";
import govLogo from "@/assets/image copy.png";

export function SiteHeader() {
  return (
    <header className="kk-header">
      <div className="kk-wrap kk-header-in">
        <div className="kk-logo">
          <img src={govLogo} alt="Government of Karnataka emblem" width={58} height={58} />
          <img src={univLogo} alt="Karnataka State Akkamahadevi Women's University logo" width={58} height={58} />
        </div>
        <div className="kk-header-titles">
          <p className="kk-header-title">Karnataka State Akkamahadevi Women&apos;s University</p>
          <p className="kk-header-sub">Vijayapura, Karnataka</p>
        </div>
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
          For any clarifications please, email: <a href="mailto:skills@kswu.ac.in">skills@kswu.ac.in</a>
        </p>
      </div>
    </section>
  );
}
