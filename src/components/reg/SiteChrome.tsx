import univLogo from "@/assets/image.png";
import govLogo from "@/assets/image copy.png";

export function SiteHeader({ variant = "default" }: { variant?: "default" | "admin" }) {
  const isAdmin = variant === "admin";
  return (
    <header className={`kk-header ${isAdmin ? "border-b-[3.5px] border-[#EE5D1D] bg-white shadow-sm" : ""}`}>
      <div className={`kk-wrap kk-header-in ${isAdmin ? "max-w-[1680px] px-3 sm:px-6 py-3 min-h-[90px]" : ""}`}>
        {/* Left Corner: Karnataka State Emblem */}
        <div className="kk-logo kk-logo-left shrink-0">
          <img
            src={govLogo}
            alt="Government of Karnataka emblem"
            width={isAdmin ? 70 : 60}
            height={isAdmin ? 70 : 60}
            className={`${isAdmin ? "h-14 w-14 sm:h-16 sm:w-16" : "h-12 w-12 sm:h-15 sm:w-15"} object-contain drop-shadow-2xs transition-transform hover:scale-105`}
          />
        </div>

        {/* Center: University Title and Sub-title */}
        <div className="kk-header-titles flex flex-col items-center justify-center text-center px-1">
          <p className={`${isAdmin ? "text-lg sm:text-2xl lg:text-[26px] font-black text-[#123A6B] tracking-tight leading-snug uppercase drop-shadow-2xs" : "kk-header-title"}`}>
            Karnataka State Akkamahadevi Women&apos;s University
          </p>
          <p className={`${isAdmin ? "mt-1 text-xs sm:text-sm lg:text-[14.5px] font-extrabold uppercase tracking-[0.18em] text-[#EE5D1D]" : "kk-header-sub"}`}>
            Vijayapura, Karnataka
          </p>
        </div>

        {/* Right Corner: KSAW University Emblem */}
        <div className="kk-logo kk-logo-right shrink-0 justify-end">
          <img
            src={univLogo}
            alt="Karnataka State Akkamahadevi Women's University logo"
            width={isAdmin ? 70 : 60}
            height={isAdmin ? 70 : 60}
            className={`${isAdmin ? "h-14 w-14 sm:h-16 sm:w-16" : "h-12 w-12 sm:h-15 sm:w-15"} object-contain drop-shadow-2xs transition-transform hover:scale-105`}
          />
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
