import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/reg/SiteChrome";
import { COLUMNS, STATUS_OPTIONS, formatCell } from "@/lib/registrationColumns";
import { SKILLS, CATEGORIES, DISTRICTS } from "@/components/reg/options";
import { NIGAMAS } from "@/components/reg/castes";
import { supabase } from "@/integrations/supabase/client";

const title = "Registrations Dashboard | Admin";
const description = "Browse, search, filter, edit and export all student registration submissions.";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Row = Record<string, unknown> & { id: string };

const PAGE_SIZES = [10, 25, 50, 100];

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [course, setCourse] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [nigama, setNigama] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<Row | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; name: string } | null>(null);

  const filters = { search: search.trim(), status, course, category, district, nigama };

  const listQuery = useQuery({
    queryKey: ["registrations", filters, page, pageSize, sortDesc],
    queryFn: async () => {
      let q = supabase.from("vtu-ksaw-application").select("*", { count: "exact" });
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.course) q = q.eq("skill_sought", filters.course);
      if (filters.category) q = q.eq("category", filters.category);
      if (filters.district) q = q.ilike("cur_district", `%${filters.district}%`);
      if (filters.search) {
        const s = filters.search.replace(/[%,()]/g, "");
        q = q.or(
          `reference_number.ilike.%${s}%,saf_number.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,cur_city.ilike.%${s}%,cur_district.ilike.%${s}%`,
        );
      }
      const from = page * pageSize;
      const { data, error, count } = await q
        .order("created_at", { ascending: !sortDesc })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      return { rows: (data ?? []) as Row[], count: count ?? 0 };
    },
  });

  const statsQuery = useQuery({
    queryKey: ["registration-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vtu-ksaw-application")
        .select("status, skill_sought, gender, category, created_at, cur_district")
        .limit(10000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const rows = statsQuery.data ?? [];
    const now = Date.now();
    const byStatus: Record<string, number> = {};
    const byCourse: Record<string, number> = {};
    const byGender: Record<string, number> = {};
    const byDistrict: Record<string, number> = {};
    let today = 0;
    let week = 0;
    for (const r of rows) {
      byStatus[r.status ?? "Pending"] = (byStatus[r.status ?? "Pending"] ?? 0) + 1;
      if (r.skill_sought) byCourse[r.skill_sought] = (byCourse[r.skill_sought] ?? 0) + 1;
      if (r.gender) byGender[r.gender] = (byGender[r.gender] ?? 0) + 1;
      if (r.cur_district) byDistrict[r.cur_district] = (byDistrict[r.cur_district] ?? 0) + 1;
      const t = new Date(r.created_at).getTime();
      if (now - t < 86400000) today += 1;
      if (now - t < 7 * 86400000) week += 1;
    }
    return { total: rows.length, today, week, byStatus, byCourse, byGender, byDistrict };
  }, [statsQuery.data]);

  const total = listQuery.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const [exportStatusFilter, setExportStatusFilter] = useState<string>("");
  const [statusTarget, setStatusTarget] = useState<{ id: string; name: string; status: string; reason: string; customNote: string } | null>(null);

  const REASON_OPTIONS = [
    "Wrong document",
    "Document not clear",
    "Document expired",
    "Wrong details entered",
    "Other / Custom Note",
  ] as const;

  const requestStatusChange = (row: Row, newStatus: string) => {
    setStatusTarget({
      id: row.id,
      name: `${row["first_name"] || ""} ${row["last_name"] || ""}`.trim() || "this applicant",
      status: newStatus,
      reason: newStatus === "Pending Document" || newStatus === "Rejected" ? "Wrong document" : "",
      customNote: "",
    });
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const { id, status: newStatus, reason, customNote } = statusTarget;
    const noteText = customNote.trim()
      ? customNote.trim()
      : reason
        ? reason
        : "";

    const { error } = await supabase
      .from("vtu-ksaw-application")
      .update({
        status: newStatus,
        ...(noteText ? { admin_notes: noteText } : {}),
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Status updated to ${newStatus}${noteText ? ` (${noteText})` : ""}`);
    setStatusTarget(null);
    void qc.invalidateQueries();
  };

  const remove = (row: Row) => {
    setDeleteTarget({
      ids: [row.id],
      name: `${row["first_name"] || ""} ${row["last_name"] || ""}`.trim() || "this record",
    });
  };

  const removeSelected = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget({
      ids: selectedIds,
      name: `${selectedIds.length} selected applicant record${selectedIds.length === 1 ? "" : "s"}`,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { ids } = deleteTarget;
    const { error } = await supabase.from("vtu-ksaw-application").delete().in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Deleted ${ids.length} record${ids.length === 1 ? "" : "s"}`);
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    setDeleteTarget(null);
    void qc.invalidateQueries();
  };

  const exportCsv = () => {
    let rows = listQuery.data?.rows ?? [];
    if (exportStatusFilter) {
      rows = rows.filter((r) => (r.status || "Pending") === exportStatusFilter);
    }
    if (!rows.length) {
      toast.error(`No records found to export${exportStatusFilter ? ` with status "${exportStatusFilter}"` : ""}`);
      return;
    }
    const head = COLUMNS.map((c) => c.label).join(",");
    const body = rows
      .map((r) =>
        COLUMNS.map((c) => `"${String(formatCell(r[c.key], c.type)).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filterSuffix = exportStatusFilter ? `-${exportStatusFilter.toLowerCase().replace(/\s+/g, "_")}` : "";
    a.download = `registrations${filterSuffix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} record${rows.length === 1 ? "" : "s"} to CSV`);
  };

  const allRowIds = useMemo(() => (listQuery.data?.rows ?? []).map((r) => r.id), [listQuery.data?.rows]);
  const isAllSelected = allRowIds.length > 0 && allRowIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = allRowIds.some((id) => selectedIds.includes(id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allRowIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allRowIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="kk-page min-h-screen bg-muted/20">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Registrations Dashboard</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">Manage and inspect all applicant registrations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-card border border-border px-2 py-1 rounded-md shadow-xs">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Export:</label>
              <select
                className="bg-transparent border-0 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
                value={exportStatusFilter}
                onChange={(e) => setExportStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn-kk btn-cancel-kk text-xs sm:text-sm py-1.5 px-3 sm:py-2 sm:px-4" onClick={exportCsv}>
              📥 Export CSV
            </button>
            <button type="button" className="btn-kk btn-primary-kk text-xs sm:text-sm py-1.5 px-3 sm:py-2 sm:px-4" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </div>

        <section className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
          <StatCard label="Total Registrations" value={stats.total} />
          <StatCard label="Today" value={stats.today} />
          <StatCard label="Last 7 Days" value={stats.week} />
          {STATUS_OPTIONS.map((s) => (
            <StatCard key={s} label={s} value={stats.byStatus[s] ?? 0} />
          ))}
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Breakdown title="By Course" data={stats.byCourse} />
          <Breakdown title="By Gender" data={stats.byGender} />
          <div className="sm:col-span-2 lg:col-span-1">
            <Breakdown title="Top Districts" data={stats.byDistrict} limit={6} />
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-border bg-card p-3 shadow-xs sm:p-5">
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <div className="sm:col-span-2 xl:col-span-2">
              <label className="ctrl-label text-xs" htmlFor="q">
                Search Applicants
              </label>
              <input
                id="q"
                className="form-ctrl text-xs sm:text-sm h-9"
                placeholder="Name, email, phone, city, district..."
                value={search}
                onChange={(e) => resetPage(setSearch)(e.target.value)}
              />
            </div>
            <FilterSelect label="Status" value={status} onChange={resetPage(setStatus)} options={STATUS_OPTIONS} />
            <FilterSelect label="Course" value={course} onChange={resetPage(setCourse)} options={SKILLS} />
            <FilterSelect label="Category" value={category} onChange={resetPage(setCategory)} options={CATEGORIES} />
            <FilterSelect label="District" value={district} onChange={resetPage(setDistrict)} options={DISTRICTS["KARNATAKA"] || []} />
            <FilterSelect label="Nigama" value={nigama} onChange={resetPage(setNigama)} options={NIGAMAS} />
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {listQuery.isLoading ? "Loading…" : `${total} Record${total === 1 ? "" : "s"} Found`}
              </span>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    ({selectedIds.length} selected)
                  </span>
                  <button
                    type="button"
                    onClick={removeSelected}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-xs cursor-pointer"
                  >
                    🗑️ Delete ({selectedIds.length})
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3">
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/80 text-xs">
                <button
                  type="button"
                  onClick={() => setSortDesc((v) => !v)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-card border border-border/60 hover:bg-muted text-foreground transition-colors shadow-2xs cursor-pointer"
                >
                  Sort: <span className="font-semibold text-primary">{sortDesc ? "Newest" : "Oldest"}</span>
                </button>

                <span className="text-border px-0.5">|</span>

                <select
                  className="bg-transparent border-0 py-1 pl-1 pr-5 text-xs font-medium text-foreground focus:outline-hidden focus:ring-0 cursor-pointer"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/80 text-xs">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center justify-center h-7 px-2 text-xs font-medium rounded-md bg-card border border-border/60 text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
                >
                  ← Prev
                </button>
                <span className="px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Page <strong className="text-foreground">{page + 1}</strong> of <strong className="text-foreground">{pageCount}</strong>
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center justify-center h-7 px-2 text-xs font-medium rounded-md bg-card border border-border/60 text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {listQuery.isError ? (
            <p className="mt-3 text-xs sm:text-sm text-destructive">
              Could not load records. Your account may not have admin access yet.
            </p>
          ) : null}

          <div className="mt-3 overflow-x-auto rounded-lg border border-border shadow-2xs bg-card">
            <table className="w-full min-w-[1700px] border-collapse text-xs sm:text-sm">
              <thead className="bg-muted/70 text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-20 bg-muted px-3 py-3 text-center font-semibold border-r border-border w-12 shadow-[1px_0_0_rgba(0,0,0,0.06)]">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer align-middle"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="sticky left-12 z-10 bg-muted px-3 py-3 text-left font-semibold border-r border-border min-w-[150px] shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                    Actions
                  </th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-3 py-3 text-left font-semibold">
                      {c.label}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-3 py-3 text-left font-semibold min-w-[240px] bg-muted/90">
                    Decision / Review
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(listQuery.data?.rows ?? []).map((r) => {
                  const isChecked = selectedIds.includes(r.id);
                  const curStatus = r.status || "Pending";
                  return (
                    <tr key={r.id} className={`transition-colors ${isChecked ? "bg-primary/5" : "odd:bg-background even:bg-muted/20 hover:bg-muted/40"}`}>
                      <td className="sticky left-0 z-20 whitespace-nowrap bg-card px-3 py-2.5 text-center border-r border-border">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(r.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer align-middle"
                        />
                      </td>
                      <td className="sticky left-12 z-10 whitespace-nowrap bg-card px-3 py-2.5 border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewing(r)}
                            className="inline-flex items-center justify-center rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setEditing(r)}
                            className="inline-flex items-center justify-center rounded bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => remove(r)}
                            className="inline-flex items-center justify-center rounded bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                      {COLUMNS.map((c) => {
                        const cellVal = r[c.key];
                        const isUrl = typeof cellVal === "string" && cellVal.startsWith("http");
                        return (
                          <td key={c.key} className="whitespace-nowrap px-3 py-2.5 text-foreground max-w-[280px] truncate">
                            {isUrl ? (
                              <a
                                href={cellVal}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline hover:text-primary/80 font-medium inline-flex items-center gap-1"
                              >
                                📎 View File
                              </a>
                            ) : (
                              formatCell(cellVal, c.type)
                            )}
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-3 py-2.5 bg-muted/10">
                        {curStatus !== "Pending" ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold shadow-2xs ${curStatus === "Approved"
                                  ? "bg-emerald-600 text-white"
                                  : curStatus === "Rejected"
                                    ? "bg-red-600 text-white"
                                    : "bg-amber-600 text-white"
                                }`}
                            >
                              {curStatus === "Approved" ? "✓ Approved" : curStatus === "Rejected" ? "✕ Rejected" : "📄 Pending Doc"}
                            </span>
                            <button
                              type="button"
                              onClick={() => requestStatusChange(r, curStatus === "Approved" ? "Pending Document" : "Approved")}
                              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => requestStatusChange(r, "Approved")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
                              title="Set status to Approved"
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => requestStatusChange(r, "Rejected")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/15 text-red-700 hover:bg-red-500/25 border border-red-500/30 transition-colors cursor-pointer"
                              title="Set status to Rejected"
                            >
                              ✕ Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => requestStatusChange(r, "Pending Document")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border border-amber-500/30 transition-colors cursor-pointer"
                              title="Set status to Pending Document"
                            >
                              📄 Pending Doc
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!listQuery.isLoading && (listQuery.data?.rows.length ?? 0) === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-muted-foreground" colSpan={COLUMNS.length + 3}>
                      No registrations match your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {viewing ? (
        <ViewDialog
          row={viewing}
          onClose={() => setViewing(null)}
          onAction={(r, s) => requestStatusChange(r, s)}
        />
      ) : null}
      {editing ? (
        <EditDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void qc.invalidateQueries();
          }}
        />
      ) : null}

      {statusTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${statusTarget.status === "Approved"
                  ? "bg-emerald-500/15 text-emerald-600"
                  : statusTarget.status === "Rejected"
                    ? "bg-red-500/15 text-red-600"
                    : "bg-amber-500/15 text-amber-600"
                }`}>
                {statusTarget.status === "Approved" ? "✓" : statusTarget.status === "Rejected" ? "✕" : "📄"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Confirm Status Change</h3>
                <p className="text-xs text-muted-foreground">Application verification and review</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-foreground">
              Are you sure you want to mark the application for <strong className="font-semibold text-primary">{statusTarget.name}</strong> as <strong className="font-bold">{statusTarget.status}</strong>?
            </p>

            {(statusTarget.status === "Pending Document" || statusTarget.status === "Rejected") && (
              <div className="mt-4 space-y-2 rounded-lg bg-muted/40 p-3 border border-border">
                <label className="text-xs font-semibold text-foreground block">
                  Select Reason / Note:
                </label>
                <select
                  className="w-full form-ctrl text-xs bg-card"
                  value={statusTarget.reason}
                  onChange={(e) =>
                    setStatusTarget((prev) =>
                      prev ? { ...prev, reason: e.target.value } : null,
                    )
                  }
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {statusTarget.reason === "Other / Custom Note" && (
                  <input
                    type="text"
                    placeholder="Enter custom admin note..."
                    className="w-full form-ctrl text-xs mt-2"
                    value={statusTarget.customNote}
                    onChange={(e) =>
                      setStatusTarget((prev) =>
                        prev ? { ...prev, customNote: e.target.value } : null,
                      )
                    }
                  />
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmStatusChange()}
                className={`px-4 py-2 text-xs font-semibold rounded-md text-white transition-colors cursor-pointer shadow-xs ${statusTarget.status === "Approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : statusTarget.status === "Rejected"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
              >
                Yes, Set to {statusTarget.status}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Confirm Delete</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-foreground">
              Are you sure you want to delete <strong className="text-destructive font-semibold">{deleteTarget.name}</strong>? All associated application details will be permanently removed.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="px-4 py-2 text-xs font-semibold rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer shadow-xs"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Breakdown({ title, data, limit = 10 }: { title: string; data: Record<string, number>; limit?: number }) {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  const max = entries[0]?.[1] ?? 1;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {entries.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No data yet.</p> : null}
      <ul className="mt-2 space-y-2">
        {entries.map(([k, v]) => (
          <li key={k}>
            <div className="flex justify-between text-xs">
              <span className="truncate pr-2 text-foreground">{k}</span>
              <span className="text-muted-foreground">{v}</span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-muted">
              <div className="h-1.5 rounded bg-primary" style={{ width: `${(v / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <label className="ctrl-label">{label}</label>
      <select className="form-ctrl" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-card p-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button className="text-sm text-muted-foreground underline" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function shouldShowField(key: string, row: Row): boolean {
  if (["sa_types", "sa_sub_types", "sa_proof"].includes(key)) {
    return row["specially_abled"] === "Yes";
  }
  if (["caste", "caste_sub_category", "nigama", "caste_cert_type", "rd_number", "caste_cert_issue_date", "caste_cert_expiry_date", "caste_proof"].includes(key)) {
    return row["category"] !== "General";
  }
  if (["stream", "subject"].includes(key)) {
    return row["education"] !== "10th";
  }
  if (key === "skill_experience_proof") {
    return row["past_skill_experience"] === "Yes";
  }
  if (["employed_from", "current_employer", "current_designation"].includes(key)) {
    return row["currently_employed"] === "Yes";
  }
  if (["work_experience", "last_employer", "last_designation", "last_salary", "last_employer_address", "employment_proof"].includes(key)) {
    return row["previously_employed"] === "Yes";
  }
  if (key.startsWith("per_")) {
    return row["same_address"] !== "Yes";
  }
  return true;
}

function ViewDialog({
  row,
  onClose,
  onAction,
}: {
  row: Row;
  onClose: () => void;
  onAction: (row: Row, status: string) => void;
}) {
  const visibleColumns = COLUMNS.filter((c) => shouldShowField(c.key, row));
  const groups = [...new Set(visibleColumns.map((c) => c.group))];
  const curStatus = row.status || "Pending";

  return (
    <Dialog title={`${row["first_name"]} ${row["last_name"]}`} onClose={onClose}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 bg-muted/20 px-3 rounded-md mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Current Status:</span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${curStatus === "Approved"
                ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                : curStatus === "Rejected"
                  ? "bg-red-500/15 text-red-700 border border-red-500/30"
                  : curStatus === "Pending Document"
                    ? "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                    : "bg-primary/10 text-primary border border-primary/20"
              }`}
          >
            {curStatus}
          </span>
          {row["admin_notes"] && (
            <span className="text-xs text-muted-foreground italic truncate max-w-[200px]" title={row["admin_notes"]}>
              ({row["admin_notes"]})
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {curStatus !== "Approved" && (
            <button
              type="button"
              onClick={() => onAction(row, "Approved")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
            >
              ✓ Approve
            </button>
          )}
          {curStatus !== "Rejected" && (
            <button
              type="button"
              onClick={() => onAction(row, "Rejected")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/15 text-red-700 hover:bg-red-500/25 border border-red-500/30 transition-colors cursor-pointer"
            >
              ✕ Reject
            </button>
          )}
          {curStatus !== "Pending Document" && (
            <button
              type="button"
              onClick={() => onAction(row, "Pending Document")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border border-amber-500/30 transition-colors cursor-pointer"
            >
              📄 Pending Document
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {groups.map((g) => (
          <div key={g}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1 mb-2">{g}</h3>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleColumns.filter((c) => c.group === g).map((c) => {
                const val = row[c.key];
                const isUrl = typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"));
                return (
                  <div key={c.key} className="rounded border border-border bg-muted/10 p-2.5 flex flex-col justify-between min-h-[64px]">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">{c.label}</dt>
                      <dd className="break-words text-sm text-foreground mt-1 font-normal">
                        {isUrl ? (
                          val.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)/) ? (
                            <div className="flex flex-col gap-2 mt-1">
                              <img src={val} alt={c.label} className="h-16 w-16 object-cover rounded border border-border bg-card shadow-sm" />
                              <a
                                href={val}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-max"
                              >
                                View Image
                              </a>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <a
                                href={val}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 justify-center rounded border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                📄 View PDF Document
                              </a>
                            </div>
                          )
                        ) : (
                          formatCell(val, c.type)
                        )}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

function EditDialog({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, unknown>>({ ...row });
  const [busy, setBusy] = useState(false);

  const visibleColumns = COLUMNS.filter((c) => c.key !== "created_at" && shouldShowField(c.key, form as Row));
  const groups = [...new Set(visibleColumns.map((c) => c.group))];

  const save = async () => {
    const first = String(form["first_name"] ?? "").trim();
    const last = String(form["last_name"] ?? "").trim();
    const phone = String(form["phone"] ?? "").trim();
    const email = String(form["email"] ?? "").trim();
    if (!first || !last) {
      toast.error("First and last name are required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10 digit phone number");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    const payload: Record<string, unknown> = {};
    for (const c of COLUMNS) {
      if (c.key === "created_at") continue;
      let v = form[c.key];
      if (c.type === "array") {
        v = typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : (v ?? []);
      } else if (c.type === "date") {
        v = v ? v : null;
      }
      payload[c.key] = v;
    }
    setBusy(true);
    const { error } = await supabase.from("vtu-ksaw-application").update(payload as never).eq("id", row.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Registration updated");
    onSaved();
  };

  return (
    <Dialog title="Edit Registration" onClose={onClose}>
      <div className="mt-3 max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        {groups.map((g) => (
          <div key={g}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1 mb-2">{g}</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleColumns.filter((c) => c.group === g).map((c) => {
                const raw = form[c.key];
                const value = Array.isArray(raw) ? raw.join(", ") : raw == null ? "" : String(raw);
                return (
                  <div key={c.key}>
                    <label className="ctrl-label">{c.label}</label>
                    {c.type === "select" ? (
                      <select
                        className="form-ctrl"
                        value={value}
                        onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                      >
                        {(c.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : c.type === "bool" ? (
                      <select
                        className="form-ctrl"
                        value={raw ? "Yes" : "No"}
                        onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value === "Yes" }))}
                      >
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    ) : (
                      <input
                        className="form-ctrl"
                        type={c.type === "date" ? "date" : "text"}
                        value={c.type === "date" ? value.slice(0, 10) : value}
                        onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
        <button className="btn-kk btn-cancel-kk" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-kk btn-primary-kk" onClick={() => void save()} disabled={busy}>
          {busy ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Dialog>
  );
}
