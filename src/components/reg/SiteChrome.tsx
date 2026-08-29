import vtuLogo from "@/assets/1688801367-FGTrsAkEXl (1).png";
import govLogo from "@/assets/image copy.png";

export function SiteHeader() {
  return (
    <header className="kk-header">
      <div className="kk-wrap kk-header-in">
        <div className="kk-logo">
          <img src={govLogo} alt="Government of Karnataka emblem" width={72} height={72} />
        </div>
        <div className="kk-header-titles">
          <p className="kk-header-kn">
            <strong className="kk-header-kn-main">ವಿಶ್ವೇಶ್ವರಯ್ಯ ತಾಂತ್ರಿಕ ವಿಶ್ವವಿದ್ಯಾಲಯ, ಬೆಳಗಾವಿ</strong>{" "}
            <span className="kk-header-kn-sub">(ಕರ್ನಾಟಕ ಸರ್ಕಾರದ ತಾಂತ್ರಿಕ ವಿಶ್ವವಿದ್ಯಾಲಯ)</span>
          </p>
          <p className="kk-header-en">
            <strong className="kk-header-en-main">Visvesvaraya Technological University, Belagavi</strong>{" "}
            <span className="kk-header-en-sub">(State Technological University, Govt. of Karnataka)</span>
          </p>
        </div>
        <div className="kk-header-right">
          <img src={vtuLogo} alt="VTU Center for Online Education logo" />
        </div>
      </div>
    </header>
  );
}

export function PageBanner({
  isEditing,
  activeRef,
}: {
  isEditing?: boolean;
  activeRef?: string;
}) {
  return (
    <section className="kk-banner">
      <div className="kk-wrap">
        <div className="flex flex-col items-center justify-center text-center py-4 px-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wide text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.7)]">
            {isEditing ? `Editing Application (${activeRef})` : "Registration Form"}
          </h1>
          {isEditing ? (
            <p className="text-xs sm:text-sm text-white font-medium mt-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Modify details or documents below and click &quot;Save Changes&quot;.
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-white/95 font-medium mt-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
              Karnataka Skill Development Corporation &amp; University Training Program
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({
  onEdit,
  onLinkSAF,
  isEditing,
}: {
  onEdit?: () => void;
  onLinkSAF?: () => void;
  isEditing?: boolean;
}) {
  return (
    <footer className="border-t border-border bg-slate-900 text-slate-200 py-8 mt-12 shadow-inner">
      <div className="kk-wrap flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-1">
          <p className="font-bold text-sm text-white tracking-wide">
            Visvesvaraya Technological University
          </p>
          <p className="text-xs text-slate-400">
            Belagavi, Karnataka • Skill Training &amp; Registration Portal
          </p>
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} Government of Karnataka. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {onLinkSAF && (
            <button
              type="button"
              onClick={onLinkSAF}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              <span>🔗</span> Link SAF Number
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              <span>✏️</span> {isEditing ? "Edit Another Application" : "Edit Application"}
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
