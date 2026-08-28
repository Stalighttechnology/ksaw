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
            Karnataka State Akkamahadevi Women&apos;s University
          </p>
          <p className="text-xs text-slate-400">
            Vijayapura, Karnataka • Skill Training &amp; Registration Portal
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
