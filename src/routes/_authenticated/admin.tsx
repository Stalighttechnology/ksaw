import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/reg/SiteChrome";
import { COLUMNS, STATUS_OPTIONS, formatCell } from "@/lib/registrationColumns";
import { SKILLS, CATEGORIES } from "@/components/reg/options";
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
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<Row | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);

  const filters = { search: search.trim(), status, course, category, district };

  const listQuery = useQuery({
    queryKey: ["registrations", filters, page, pageSize, sortDesc],
    queryFn: async () => {
      let q = supabase.from("registrations").select("*", { count: "exact" });
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.course) q = q.eq("skill_sought", filters.course);
      if (filters.category) q = q.eq("category", filters.category);
      if (filters.district) q = q.ilike("cur_district", `%${filters.district}%`);
      if (filters.search) {
        const s = filters.search.replace(/[%,()]/g, "");
        q = q.or(
          `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,cur_city.ilike.%${s}%,cur_district.ilike.%${s}%`,
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
        .from("registrations")
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

  const remove = async (row: Row) => {
    if (!window.confirm(`Delete registration of ${row["first_name"]} ${row["last_name"]}? This cannot be undone.`)) return;
    const { error } = await supabase.from("registrations").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Registration deleted");
    void qc.invalidateQueries();
  };

  const exportCsv = () => {
    const rows = listQuery.data?.rows ?? [];
    if (!rows.length) {
      toast.error("Nothing to export");
      return;
    }
    const head = COLUMNS.map((c) => c.label).join(",");
    const body = rows
      .map((r) =>
        COLUMNS.map((c) => `"${String(formatCell(r[c.key], c.type)).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="kk-page min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Registrations Dashboard</h1>
            <p className="text-sm text-muted-foreground">All submitted registration forms with full details.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-kk btn-cancel-kk" onClick={exportCsv}>
              Export CSV
            </button>
            <button type="button" className="btn-kk btn-primary-kk" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <StatCard label="Total Registrations" value={stats.total} />
          <StatCard label="Today" value={stats.today} />
          <StatCard label="Last 7 Days" value={stats.week} />
          {STATUS_OPTIONS.map((s) => (
            <StatCard key={s} label={s} value={stats.byStatus[s] ?? 0} />
          ))}
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-3">
          <Breakdown title="By Course" data={stats.byCourse} />
          <Breakdown title="By Gender" data={stats.byGender} />
          <Breakdown title="Top Districts" data={stats.byDistrict} limit={6} />
        </section>

        <section className="mt-5 rounded-lg border border-border bg-card p-3 sm:p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="ctrl-label" htmlFor="q">
                Search
              </label>
              <input
                id="q"
                className="form-ctrl"
                placeholder="Name, email, phone, city, district"
                value={search}
                onChange={(e) => resetPage(setSearch)(e.target.value)}
              />
            </div>
            <FilterSelect label="Status" value={status} onChange={resetPage(setStatus)} options={STATUS_OPTIONS} />
            <FilterSelect label="Course" value={course} onChange={resetPage(setCourse)} options={SKILLS} />
            <FilterSelect label="Category" value={category} onChange={resetPage(setCategory)} options={CATEGORIES} />
            <div>
              <label className="ctrl-label" htmlFor="district">
                District
              </label>
              <input
                id="district"
                className="form-ctrl"
                placeholder="District"
                value={district}
                onChange={(e) => resetPage(setDistrict)(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {listQuery.isLoading ? "Loading…" : `${total} record${total === 1 ? "" : "s"} found`}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="btn-kk btn-cancel-kk" onClick={() => setSortDesc((v) => !v)}>
                Sort: {sortDesc ? "Newest first" : "Oldest first"}
              </button>
              <select
                className="form-ctrl w-auto"
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
              <button
                type="button"
                className="btn-kk btn-cancel-kk"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Prev
              </button>
              <span>
                Page {page + 1} of {pageCount}
              </span>
              <button
                type="button"
                className="btn-kk btn-cancel-kk"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>

          {listQuery.isError ? (
            <p className="mt-4 text-sm text-destructive">
              Could not load records. Your account may not have admin access yet.
            </p>
          ) : null}

          <div className="mt-3 overflow-x-auto rounded border border-border">
            <table className="w-full min-w-[1600px] border-collapse text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted px-3 py-2 text-left font-semibold">Actions</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-3 py-2 text-left font-semibold">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(listQuery.data?.rows ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-border odd:bg-background even:bg-muted/30">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-3 py-2">
                      <div className="flex gap-2">
                        <button className="text-primary underline" onClick={() => setViewing(r)}>
                          View
                        </button>
                        <button className="text-primary underline" onClick={() => setEditing(r)}>
                          Edit
                        </button>
                        <button className="text-destructive underline" onClick={() => void remove(r)}>
                          Delete
                        </button>
                      </div>
                    </td>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="whitespace-nowrap px-3 py-2">
                        {formatCell(r[c.key], c.type)}
                      </td>
                    ))}
                  </tr>
                ))}
                {!listQuery.isLoading && (listQuery.data?.rows.length ?? 0) === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={COLUMNS.length + 1}>
                      No registrations match your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {viewing ? <ViewDialog row={viewing} onClose={() => setViewing(null)} /> : null}
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

function ViewDialog({ row, onClose }: { row: Row; onClose: () => void }) {
  const groups = [...new Set(COLUMNS.map((c) => c.group))];
  return (
    <Dialog title={`${row["first_name"]} ${row["last_name"]}`} onClose={onClose}>
      <div className="mt-3 space-y-4">
        {groups.map((g) => (
          <div key={g}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{g}</h3>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {COLUMNS.filter((c) => c.group === g).map((c) => (
                <div key={c.key} className="rounded border border-border p-2">
                  <dt className="text-xs text-muted-foreground">{c.label}</dt>
                  <dd className="break-words text-sm text-foreground">{formatCell(row[c.key], c.type)}</dd>
                </div>
              ))}
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
  const groups = [...new Set(COLUMNS.filter((c) => c.key !== "created_at").map((c) => c.group))];

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
    const { error } = await supabase.from("registrations").update(payload as never).eq("id", row.id);
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
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{g}</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COLUMNS.filter((c) => c.group === g && c.key !== "created_at").map((c) => {
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
