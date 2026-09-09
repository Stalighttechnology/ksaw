import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/reg/SiteChrome";
import { COLUMNS, STATUS_OPTIONS, formatCell } from "@/lib/registrationColumns";
import {
  SKILLS,
  CATEGORIES,
  DISTRICTS,
  TALUKS,
  STREAMS,
  SUBJECTS,
  LANGUAGES_KNOWN,
  COLLEGES,
  getCollegeAliases,
  normalizeCollegeName,
} from "@/components/reg/options";
import { NIGAMAS, CASTES, CASTE_NAMES, CASTE_CATEGORIES, normalizeNigamaName, getNigamaAliases } from "@/components/reg/castes";
import { supabase } from "@/integrations/supabase/client";
import { read, utils } from "xlsx";

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

const PAGE_SIZES = [
  { label: "10 / page", value: 10 },
  { label: "25 / page", value: 25 },
  { label: "50 / page", value: 50 },
  { label: "100 / page", value: 100 },
  { label: "View All", value: -1 },
];

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [course, setCourse] = useState("");
  const [category, setCategory] = useState("");
  const [centerLocation, setCenterLocation] = useState("");
  const [nigama, setNigama] = useState("");
  const [partner, setPartner] = useState("");
  const [safStatus, setSafStatus] = useState("");
  const [gender, setGender] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "">("");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<Row | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; name: string } | null>(null);

  const tableSectionRef = useRef<HTMLElement>(null);

  const scrollToTable = () => {
    setTimeout(() => {
      const el = tableSectionRef.current || document.getElementById("records-section");
      if (el) {
        const navHeight = 70;
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetTop = rect.top + scrollTop - navHeight;
        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: "smooth",
        });
      }
    }, 40);
  };

  const filters = { search: search.trim(), status, course, category, centerLocation, nigama, partner, safStatus, gender, dateFilter };

  const listQuery = useQuery({
    queryKey: ["registrations", filters, page, pageSize, sortDesc],
    queryFn: async () => {
      const selectCols = ["id", ...COLUMNS.map((c) => c.key)].join(",");
      let q = supabase.from("registrations").select(selectCols, { count: "exact" });
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.gender) q = q.eq("gender", filters.gender);
      if (filters.course) q = q.eq("skill_sought", filters.course);
      if (filters.category) q = q.eq("category", filters.category);
      if (filters.centerLocation) {
        q = q.or(`center_location.ilike.%${filters.centerLocation}%,cur_district.ilike.%${filters.centerLocation}%`);
      }
      if (filters.safStatus === "Empty / Missing") {
        q = q.or("saf_number.is.null,saf_number.eq.,saf_number.eq.N/A,saf_number.eq.NA,saf_number.not.ilike.SAF%");
      } else if (filters.safStatus === "Filled / Present") {
        q = q.ilike("saf_number", "SAF%");
      }
      if (filters.nigama) {
        const nigamaAliases = getNigamaAliases(filters.nigama);
        q = q.in("nigama", Array.from(new Set([filters.nigama, ...nigamaAliases])));
      }
      if (filters.partner) {
        const aliases = getCollegeAliases(filters.partner);
        q = q.in("institution_name", Array.from(new Set([filters.partner, ...aliases])));
      }
      if (filters.dateFilter === "today") {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        q = q.gte("created_at", startOfToday);
      } else if (filters.dateFilter === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();
        q = q.gte("created_at", startOfWeek);
      }
      if (filters.search) {
        const s = filters.search.replace(/[%,()]/g, "");
        q = q.or(
          `reference_number.ilike.%${s}%,saf_number.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,aadhaar_number.ilike.%${s}%,gender.ilike.%${s}%,rd_number.ilike.%${s}%,caste.ilike.%${s}%,nigama.ilike.%${s}%,category.ilike.%${s}%,institution_name.ilike.%${s}%,center_location.ilike.%${s}%,skill_sought.ilike.%${s}%,cur_city.ilike.%${s}%,cur_district.ilike.%${s}%,cur_taluk.ilike.%${s}%,per_city.ilike.%${s}%,per_district.ilike.%${s}%,education.ilike.%${s}%,stream.ilike.%${s}%,subject.ilike.%${s}%`,
        );
      }
      let req = q.order("created_at", { ascending: !sortDesc });
      if (pageSize > 0) {
        const from = page * pageSize;
        req = req.range(from, from + pageSize - 1);
      } else {
        req = req.limit(10000);
      }
      const { data, error, count } = await req;
      if (error) throw error;
      const rows = ((data ?? []) as Row[]).map((r) => ({
        ...r,
        institution_name: normalizeCollegeName(r.institution_name as string) || r.institution_name,
        nigama: normalizeNigamaName(r.nigama as string) || r.nigama,
      }));
      return { rows, count: count ?? 0 };
    },
    staleTime: 30_000,
  });

  const statsQuery = useQuery({
    queryKey: ["registration-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("status, skill_sought, gender, category, created_at, cur_district, center_location, institution_name, nigama")
        .limit(10000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    const rows = statsQuery.data ?? [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();

    const byStatus: Record<string, number> = {};
    const byCourse: Record<string, number> = {};
    const byGender: Record<string, number> = {};
    const byCenter: Record<string, number> = {};
    const byPartner: Record<string, number> = {};
    const byNigama: Record<string, number> = {};
    let today = 0;
    let week = 0;
    for (const r of rows) {
      byStatus[r.status ?? "Pending"] = (byStatus[r.status ?? "Pending"] ?? 0) + 1;
      if (r.skill_sought) byCourse[r.skill_sought] = (byCourse[r.skill_sought] ?? 0) + 1;
      if (r.gender) byGender[r.gender] = (byGender[r.gender] ?? 0) + 1;
      const center = r.center_location || r.cur_district;
      if (center) byCenter[center] = (byCenter[center] ?? 0) + 1;
      const partnerName = normalizeCollegeName(r.institution_name) || r.institution_name;
      if (partnerName) byPartner[partnerName] = (byPartner[partnerName] ?? 0) + 1;
      const nigamaName = normalizeNigamaName(r.nigama) || r.nigama;
      if (nigamaName) byNigama[nigamaName] = (byNigama[nigamaName] ?? 0) + 1;
      const t = new Date(r.created_at).getTime();
      if (t >= startOfToday) today += 1;
      if (t >= startOfWeek) week += 1;
    }
    return { total: rows.length, today, week, byStatus, byCourse, byGender, byCenter, byPartner, byNigama };
  }, [statsQuery.data]);

  // Dynamic filter options based on existing applications and interdependent active selections
  const dynamicFilterOptions = useMemo(() => {
    const rawRows = statsQuery.data ?? [];
    const rows = rawRows.map((r) => ({
      ...r,
      normalizedPartner: normalizeCollegeName(r.institution_name) || r.institution_name || "",
      normalizedNigama: normalizeNigamaName(r.nigama) || r.nigama || "",
      normalizedStatus: r.status || "Pending",
      normalizedCourse: r.skill_sought || "",
      normalizedCategory: r.category || "",
      normalizedCenter: r.center_location || r.cur_district || "",
    }));

    const matchesFilter = (
      r: (typeof rows)[number],
      excludeKey?: "nigama" | "status" | "partner" | "course" | "category" | "center"
    ) => {
      if (nigama && excludeKey !== "nigama") {
        const nigamaAliases = getNigamaAliases(nigama);
        if (!nigamaAliases.includes(r.nigama || "") && r.normalizedNigama !== nigama) return false;
      }
      if (status && excludeKey !== "status" && r.normalizedStatus !== status) return false;
      if (partner && excludeKey !== "partner") {
        const collegeAliases = getCollegeAliases(partner);
        if (!collegeAliases.includes(r.institution_name || "") && r.normalizedPartner !== partner) return false;
      }
      if (course && excludeKey !== "course" && r.normalizedCourse !== course) return false;
      if (category && excludeKey !== "category" && r.normalizedCategory !== category) return false;
      if (centerLocation && excludeKey !== "center") {
        if (!r.normalizedCenter.toLowerCase().includes(centerLocation.toLowerCase())) return false;
      }
      return true;
    };

    const nigamaSet = new Set<string>();
    const statusSet = new Set<string>();
    const partnerSet = new Set<string>();
    const courseSet = new Set<string>();
    const categorySet = new Set<string>();
    const centerSet = new Set<string>();

    for (const r of rows) {
      if (r.normalizedNigama && matchesFilter(r, "nigama")) nigamaSet.add(r.normalizedNigama);
      if (r.normalizedStatus && matchesFilter(r, "status")) statusSet.add(r.normalizedStatus);
      if (r.normalizedPartner && matchesFilter(r, "partner")) partnerSet.add(r.normalizedPartner);
      if (r.normalizedCourse && matchesFilter(r, "course")) courseSet.add(r.normalizedCourse);
      if (r.normalizedCategory && matchesFilter(r, "category")) categorySet.add(r.normalizedCategory);
      if (r.normalizedCenter && matchesFilter(r, "center")) centerSet.add(r.normalizedCenter);
    }

    const sortAlpha = (arr: string[]) => arr.sort((a, b) => a.localeCompare(b));

    return {
      nigamas: sortAlpha(Array.from(nigamaSet)),
      statuses: Array.from(statusSet).sort((a, b) => {
        const idxA = STATUS_OPTIONS.indexOf(a as any);
        const idxB = STATUS_OPTIONS.indexOf(b as any);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return a.localeCompare(b);
      }),
      partners: sortAlpha(Array.from(partnerSet)),
      courses: sortAlpha(Array.from(courseSet)),
      categories: sortAlpha(Array.from(categorySet)),
      centers: sortAlpha(Array.from(centerSet)),
    };
  }, [statsQuery.data, nigama, status, partner, course, category, centerLocation]);

  const total = listQuery.data?.count ?? 0;
  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

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

  const [isExporting, setIsExporting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ id: string; name: string; status: string; reason: string; customNote: string } | null>(null);

  const REASON_OPTIONS = [
    "Wrong document",
    "Document not clear",
    "Document expired",
    "Wrong details entered",
    "Other / Custom Note",
  ] as const;

  const DEPT_OPTIONS = [
    "Forwarded for verification",
    "Sent for batch allotment",
    "Sent for skill training assessment",
    "Verified & Approved by Dept",
    "Other / Custom Note",
  ] as const;

  const requestStatusChange = (row: Row, newStatus: string) => {
    setStatusTarget({
      id: row.id,
      name: `${row["first_name"] || ""} ${row["last_name"] || ""}`.trim() || "this applicant",
      status: newStatus,
      reason:
        newStatus === "Pending Document" || newStatus === "Rejected"
          ? "Wrong document"
          : newStatus === "Sent to Department"
            ? "Forwarded for verification"
            : newStatus === "Approved by Dept"
              ? "Verified & Approved by Dept"
              : "",
      customNote: "",
    });
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const { id, status: newStatus, reason, customNote } = statusTarget;
    const detail = customNote.trim() || reason || "";
    const adminNote = detail ? `${newStatus} - ${detail}` : newStatus;

    const { error } = await supabase
      .from("registrations")
      .update({
        status: newStatus,
        admin_notes: adminNote,
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Status updated to ${newStatus}${detail ? ` (${detail})` : ""}`);
    setStatusTarget(null);
    void qc.invalidateQueries({ queryKey: ["registrations"] });
    void qc.invalidateQueries({ queryKey: ["registration-stats"] });
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
    const { error } = await supabase.from("registrations").delete().in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Deleted ${ids.length} record${ids.length === 1 ? "" : "s"}`);
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    setDeleteTarget(null);
    void qc.invalidateQueries({ queryKey: ["registrations"] });
    void qc.invalidateQueries({ queryKey: ["registration-stats"] });
  };

  const exportCsv = async () => {
    try {
      setIsExporting(true);
      const selectCols = ["id", ...COLUMNS.map((c) => c.key)].join(",");
      let q = supabase.from("registrations").select(selectCols);
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.gender) q = q.eq("gender", filters.gender);
      if (filters.course) q = q.eq("skill_sought", filters.course);
      if (filters.category) q = q.eq("category", filters.category);
      if (filters.centerLocation) {
        q = q.or(`center_location.ilike.%${filters.centerLocation}%,cur_district.ilike.%${filters.centerLocation}%`);
      }
      if (filters.safStatus === "Empty / Missing") {
        q = q.or("saf_number.is.null,saf_number.eq.,saf_number.eq.N/A,saf_number.eq.NA,saf_number.not.ilike.SAF%");
      } else if (filters.safStatus === "Filled / Present") {
        q = q.ilike("saf_number", "SAF%");
      }
      if (filters.nigama) {
        const nigamaAliases = getNigamaAliases(filters.nigama);
        q = q.in("nigama", Array.from(new Set([filters.nigama, ...nigamaAliases])));
      }
      if (filters.partner) {
        const aliases = getCollegeAliases(filters.partner);
        q = q.in("institution_name", Array.from(new Set([filters.partner, ...aliases])));
      }
      if (filters.dateFilter === "today") {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        q = q.gte("created_at", startOfToday);
      } else if (filters.dateFilter === "week") {
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();
        q = q.gte("created_at", startOfWeek);
      }
      if (filters.search) {
        const s = filters.search.replace(/[%,()]/g, "");
        q = q.or(
          `reference_number.ilike.%${s}%,saf_number.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,aadhaar_number.ilike.%${s}%,gender.ilike.%${s}%,rd_number.ilike.%${s}%,caste.ilike.%${s}%,nigama.ilike.%${s}%,category.ilike.%${s}%,institution_name.ilike.%${s}%,center_location.ilike.%${s}%,skill_sought.ilike.%${s}%,cur_city.ilike.%${s}%,cur_district.ilike.%${s}%,cur_taluk.ilike.%${s}%,per_city.ilike.%${s}%,per_district.ilike.%${s}%,education.ilike.%${s}%,stream.ilike.%${s}%,subject.ilike.%${s}%`,
        );
      }
      const { data, error } = await q.order("created_at", { ascending: !sortDesc }).limit(20000);
      if (error) throw error;

      const rows = ((data ?? []) as Row[]).map((r) => ({
        ...r,
        institution_name: normalizeCollegeName(r.institution_name as string) || r.institution_name,
        nigama: normalizeNigamaName(r.nigama as string) || r.nigama,
      }));

      if (!rows.length) {
        toast.error("No matching records found to export.");
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
      const statusSuffix = filters.status ? `-${filters.status.toLowerCase().replace(/\s+/g, "_")}` : "";
      a.download = `registrations${statusSuffix}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} record${rows.length === 1 ? "" : "s"} to CSV`);
    } catch (err: any) {
      toast.error(`Export failed: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
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

  const [isImportingSaf, setIsImportingSaf] = useState(false);
  const [safConfirmModalOpen, setSafConfirmModalOpen] = useState(false);
  const [safPassword, setSafPassword] = useState("");
  const [safPasswordError, setSafPasswordError] = useState("");
  const [pendingSafData, setPendingSafData] = useState<{
    file: File;
    totalRows: number;
    rows: any[];
    refIdx: number;
    safIdx: number;
    aadhaarIdx: number;
    fnIdx: number;
    lnIdx: number;
  } | null>(null);

  const [safImportModalOpen, setSafImportModalOpen] = useState(false);
  const [safImportReport, setSafImportReport] = useState<{
    total: number;
    updated: number;
    unchanged: number;
    unmatched: Array<{ ref: string; aadhaar: string; name: string; saf: string }>;
  } | null>(null);
  const safFileInputRef = useRef<HTMLInputElement>(null);

  const handleSafFileSelect = async (file: File) => {
    try {
      setIsImportingSaf(true);
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });

      if (rawRows.length < 2) {
        toast.error("The selected file contains no data rows.");
        return;
      }

      const headers = rawRows[0].map((h: any) => String(h).trim().toLowerCase());
      const findCol = (candidates: string[]) => {
        return headers.findIndex((h: string) => candidates.some((c) => h.includes(c)));
      };

      const refIdx = findCol(["ref", "reference", "app_no", "application", "reg"]);
      const safIdx = findCol(["saf", "saf_no", "saf id", "safid"]);
      const aadhaarIdx = findCol(["aadhaar", "adhar", "uid", "aadhar"]);
      const fnIdx = findCol(["first name", "firstname", "first", "candidate name", "name", "student name"]);
      const lnIdx = findCol(["last name", "lastname", "last", "surname"]);

      if (safIdx === -1 && refIdx === -1 && aadhaarIdx === -1) {
        toast.error("Could not find SAF Number, Reference ID, or Aadhaar columns in this file.");
        return;
      }

      setPendingSafData({
        file,
        totalRows: rawRows.length - 1,
        rows: rawRows.slice(1),
        refIdx,
        safIdx,
        aadhaarIdx,
        fnIdx,
        lnIdx,
      });
      setSafPassword("");
      setSafPasswordError("");
      setSafConfirmModalOpen(true);
    } catch (err: any) {
      toast.error(`Failed to read file: ${err.message || err}`);
    } finally {
      setIsImportingSaf(false);
      if (safFileInputRef.current) safFileInputRef.current.value = "";
    }
  };

  const processSafImport = async () => {
    if (!pendingSafData) return;
    if (safPassword.trim() !== "Gleamator@2025") {
      setSafPasswordError("Incorrect password. Verification required.");
      return;
    }

    try {
      setIsImportingSaf(true);
      setSafPasswordError("");
      const { rows: fileRows, refIdx, safIdx, aadhaarIdx, fnIdx, lnIdx } = pendingSafData;

      const { data: portalRows, error } = await supabase
        .from("registrations")
        .select("id, reference_number, aadhaar_number, saf_number, first_name, last_name")
        .limit(10000);

      if (error || !portalRows) {
        throw new Error(error?.message || "Failed to fetch registrations for matching.");
      }

      const cleanRef = (s?: string | null) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const cleanAadhaar = (s?: string | null) => (s || "").replace(/[^0-9]/g, "");

      let updatedCount = 0;
      let unchangedCount = 0;
      const unmatchedList: Array<{ ref: string; aadhaar: string; name: string; saf: string }> = [];

      for (let i = 0; i < fileRows.length; i++) {
        const row = fileRows[i];
        if (!row || !row.length) continue;

        const refVal = refIdx !== -1 ? String(row[refIdx] ?? "").trim() : "";
        const safVal = safIdx !== -1 ? String(row[safIdx] ?? "").trim() : "";
        const aadhaarVal = aadhaarIdx !== -1 ? String(row[aadhaarIdx] ?? "").trim() : "";
        const nameVal = `${fnIdx !== -1 ? String(row[fnIdx] ?? "").trim() : ""} ${lnIdx !== -1 ? String(row[lnIdx] ?? "").trim() : ""}`.trim();

        if (!safVal) continue;

        const cRef = cleanRef(refVal);
        const cAadhaar = cleanAadhaar(aadhaarVal);

        const match = portalRows.find((p) => {
          const pRef = cleanRef(p.reference_number);
          const pAadhaar = cleanAadhaar(p.aadhaar_number);
          return (cRef && pRef && pRef === cRef) || (cAadhaar && pAadhaar && cAadhaar.length >= 10 && pAadhaar === cAadhaar);
        });

        if (!match) {
          unmatchedList.push({ ref: refVal || "N/A", aadhaar: aadhaarVal || "N/A", name: nameVal || "N/A", saf: safVal });
          continue;
        }

        if (match.saf_number?.trim() === safVal) {
          unchangedCount++;
          continue;
        }

        const { error: updateErr } = await supabase
          .from("registrations")
          .update({ saf_number: safVal })
          .eq("id", match.id);

        if (updateErr) {
          console.error(`Error updating record ${match.reference_number}:`, updateErr);
          unmatchedList.push({ ref: refVal, aadhaar: aadhaarVal, name: `${nameVal} (Update Error: ${updateErr.message})`, saf: safVal });
        } else {
          updatedCount++;
        }
      }

      setSafConfirmModalOpen(false);
      setPendingSafData(null);
      setSafImportReport({
        total: updatedCount + unchangedCount + unmatchedList.length,
        updated: updatedCount,
        unchanged: unchangedCount,
        unmatched: unmatchedList,
      });
      setSafImportModalOpen(true);

      void qc.invalidateQueries({ queryKey: ["registrations"] });
      void qc.invalidateQueries({ queryKey: ["registration-stats"] });

      if (updatedCount > 0) {
        toast.success(`Successfully updated SAF Numbers for ${updatedCount} matched applicant(s)!`);
      } else if (unchangedCount > 0 && unmatchedList.length === 0) {
        toast.info("All records already match the uploaded Excel SAF numbers.");
      }
    } catch (err: any) {
      console.error("SAF Import Error:", err);
      toast.error(`Import failed: ${err.message || err}`);
    } finally {
      setIsImportingSaf(false);
    }
  };

  const activeFilterCount = [
    search.trim(),
    status,
    course,
    category,
    centerLocation,
    nigama,
    partner,
    safStatus,
    gender,
    dateFilter,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch("");
    setStatus("");
    setCourse("");
    setCategory("");
    setCenterLocation("");
    setNigama("");
    setPartner("");
    setSafStatus("");
    setGender("");
    setDateFilter("");
    setPage(0);
  };

  const formattedDate = useMemo(() => {
    const d = new Date();
    const dateStr = d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return dateStr;
  }, []);

  return (
    <div className="kk-page min-h-screen bg-muted/20">
      <SiteHeader variant="admin" />
      <main className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-6 sm:py-6 space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Registrations Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Database
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Manage, inspect, verify and export applicant registrations and SAF identifiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2 shadow-2xs text-xs font-semibold text-foreground">
              <span className="text-base text-muted-foreground">📅</span>
              <span>{formattedDate}</span>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#EE5D1D] hover:bg-[#D94F12] text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
              title="Open public registration form in new tab"
            >
              <span className="text-base font-bold">+</span>
              <span>New Registration</span>
            </a>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-semibold px-3.5 py-2 transition-all cursor-pointer shadow-2xs"
              onClick={signOut}
            >
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 8 Top KPI Stat Cards (Clean, Professional 4x2 Grid) */}
        <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
          <StatCard
            label="Total Registrations"
            value={stats.total}
            badgeText="All Data"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            isActive={!status && !dateFilter && activeFilterCount === 0}
            onClick={() => {
              clearAllFilters();
              scrollToTable();
            }}
          />
          <StatCard
            label="Today"
            value={stats.today}
            badgeText="Today"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            isActive={dateFilter === "today"}
            onClick={() => {
              resetPage(setDateFilter)(dateFilter === "today" ? "" : "today");
              scrollToTable();
            }}
          />
          <StatCard
            label="Last 7 Days"
            value={stats.week}
            badgeText="7 Days"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            isActive={dateFilter === "week"}
            onClick={() => {
              resetPage(setDateFilter)(dateFilter === "week" ? "" : "week");
              scrollToTable();
            }}
          />
          <StatCard
            label="Pending Review"
            value={stats.byStatus["Pending"] ?? 0}
            percent={stats.total > 0 ? `${(((stats.byStatus["Pending"] ?? 0) / stats.total) * 100).toFixed(1)}%` : undefined}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            isActive={status === "Pending"}
            onClick={() => {
              resetPage(setStatus)(status === "Pending" ? "" : "Pending");
              scrollToTable();
            }}
          />
          <StatCard
            label="Approved"
            value={stats.byStatus["Approved"] ?? 0}
            percent={stats.total > 0 ? `${(((stats.byStatus["Approved"] ?? 0) / stats.total) * 100).toFixed(1)}%` : undefined}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            isActive={status === "Approved"}
            onClick={() => {
              resetPage(setStatus)(status === "Approved" ? "" : "Approved");
              scrollToTable();
            }}
          />
          <StatCard
            label="Sent to Department"
            value={stats.byStatus["Sent to Department"] ?? 0}
            percent={stats.total > 0 ? `${(((stats.byStatus["Sent to Department"] ?? 0) / stats.total) * 100).toFixed(1)}%` : undefined}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            }
            isActive={status === "Sent to Department"}
            onClick={() => {
              resetPage(setStatus)(status === "Sent to Department" ? "" : "Sent to Department");
              scrollToTable();
            }}
          />
          <StatCard
            label="Rejected"
            value={stats.byStatus["Rejected"] ?? 0}
            percent={stats.total > 0 ? `${(((stats.byStatus["Rejected"] ?? 0) / stats.total) * 100).toFixed(1)}%` : undefined}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            isActive={status === "Rejected"}
            onClick={() => {
              resetPage(setStatus)(status === "Rejected" ? "" : "Rejected");
              scrollToTable();
            }}
          />
          <StatCard
            label="Pending Documents"
            value={stats.byStatus["Pending Document"] ?? 0}
            percent={stats.total > 0 ? `${(((stats.byStatus["Pending Document"] ?? 0) / stats.total) * 100).toFixed(1)}%` : undefined}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            isActive={status === "Pending Document"}
            onClick={() => {
              resetPage(setStatus)(status === "Pending Document" ? "" : "Pending Document");
              scrollToTable();
            }}
          />
        </section>

        {/* 5 Analytics Breakdown Cards */}
        <section className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Breakdown
            title="Registrations by Course"
            data={stats.byCourse}
            limit={5}
            barColor="bg-primary/80"
            activeValue={course}
            onItemClick={(selectedCourse) => {
              resetPage(setCourse)(course === selectedCourse ? "" : selectedCourse);
              scrollToTable();
            }}
          />
          <Breakdown
            title="By Nigama"
            data={stats.byNigama}
            limit={5}
            barColor="bg-primary/80"
            activeValue={nigama}
            onItemClick={(selectedNigama) => {
              resetPage(setNigama)(nigama === selectedNigama ? "" : selectedNigama);
              scrollToTable();
            }}
          />
          <Breakdown
            title="By Partner"
            data={stats.byPartner}
            limit={5}
            barColor="bg-primary/80"
            activeValue={partner}
            onItemClick={(selectedPartner) => {
              resetPage(setPartner)(partner === selectedPartner ? "" : selectedPartner);
              scrollToTable();
            }}
          />
          <GenderDonut
            data={stats.byGender}
            activeGender={gender}
            onItemClick={(g) => {
              resetPage(setGender)(gender === g ? "" : g);
              scrollToTable();
            }}
          />
          <Breakdown
            title="Center Locations"
            data={stats.byCenter}
            limit={5}
            barColor="bg-primary/80"
            activeValue={centerLocation}
            onItemClick={(selectedCenter) => {
              resetPage(setCenterLocation)(centerLocation === selectedCenter ? "" : selectedCenter);
              scrollToTable();
            }}
          />
        </section>

        {/* Filter Bar & Controls Panel */}
        <section
          ref={tableSectionRef}
          id="records-section"
          style={{ scrollMarginTop: "5.5rem" }}
          className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs scroll-mt-24"
        >
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            <div className="sm:col-span-2 xl:col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between" htmlFor="q">
                <span>Search Applicants</span>
                {search && (
                  <button
                    type="button"
                    onClick={() => resetPage(setSearch)("")}
                    className="text-[10px] text-primary hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-muted-foreground text-xs select-none z-10">
                  🔍
                </span>
                <input
                  id="q"
                  className="w-full form-ctrl text-xs sm:text-sm h-9.5 rounded-xl border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  style={{ paddingLeft: "2.3rem", paddingRight: "2rem" }}
                  placeholder="Search Name, Ref ID, SAF No, Aadhaar, Phone..."
                  value={search}
                  onChange={(e) => resetPage(setSearch)(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => resetPage(setSearch)("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <FilterSelect label="Nigama" value={nigama} onChange={resetPage(setNigama)} options={dynamicFilterOptions.nigamas} />
            <FilterSelect label="Status" value={status} onChange={resetPage(setStatus)} options={dynamicFilterOptions.statuses} />
            <FilterSelect
              label="Partner"
              value={partner}
              onChange={resetPage(setPartner)}
              options={dynamicFilterOptions.partners}
            />
            <FilterSelect label="Course" value={course} onChange={resetPage(setCourse)} options={dynamicFilterOptions.courses} />
            <FilterSelect label="Category" value={category} onChange={resetPage(setCategory)} options={dynamicFilterOptions.categories} />
            <FilterSelect label="Center Location" value={centerLocation} onChange={resetPage(setCenterLocation)} options={dynamicFilterOptions.centers} />
            <FilterSelect
              label="SAF Number"
              value={safStatus}
              onChange={resetPage(setSafStatus)}
              options={["Empty / Missing", "Filled / Present"]}
            />
          </div>

          {/* Action Toolbar */}
          <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-3.5 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {listQuery.isLoading ? "Loading…" : `${total} Record${total === 1 ? "" : "s"} Found`}
              </span>

              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
                    title="Reset all active filters"
                  >
                    <span>✕ Reset All ({activeFilterCount})</span>
                  </button>

                  {dateFilter && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                      Date: {dateFilter === "today" ? "Today" : "Last 7 Days"}
                      <button type="button" onClick={() => resetPage(setDateFilter)("")} className="cursor-pointer hover:text-amber-900 ml-0.5">✕</button>
                    </span>
                  )}
                  {gender && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                      Gender: {gender}
                      <button type="button" onClick={() => resetPage(setGender)("")} className="cursor-pointer hover:text-blue-900 ml-0.5">✕</button>
                    </span>
                  )}
                  {status && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      Status: {status}
                      <button type="button" onClick={() => resetPage(setStatus)("")} className="cursor-pointer hover:text-emerald-900 ml-0.5">✕</button>
                    </span>
                  )}
                  {course && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/20 max-w-[200px] truncate">
                      Course: {course}
                      <button type="button" onClick={() => resetPage(setCourse)("")} className="cursor-pointer hover:text-blue-900 ml-0.5">✕</button>
                    </span>
                  )}
                  {nigama && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 border border-purple-500/20 max-w-[200px] truncate">
                      Nigama: {nigama}
                      <button type="button" onClick={() => resetPage(setNigama)("")} className="cursor-pointer hover:text-purple-900 ml-0.5">✕</button>
                    </span>
                  )}
                  {partner && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 max-w-[200px] truncate">
                      Partner: {partner}
                      <button type="button" onClick={() => resetPage(setPartner)("")} className="cursor-pointer hover:text-emerald-900 ml-0.5">✕</button>
                    </span>
                  )}
                  {centerLocation && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-700 border border-orange-500/20">
                      Center: {centerLocation}
                      <button type="button" onClick={() => resetPage(setCenterLocation)("")} className="cursor-pointer hover:text-orange-900 ml-0.5">✕</button>
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={isExporting || total === 0}
                onClick={exportCsv}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                title="Export filtered records to CSV"
              >
                <span>{isExporting ? "⏳" : "📥"}</span>
                <span>{isExporting ? "Exporting Data…" : "Export Filtered CSV"}</span>
              </button>

              <input
                type="file"
                ref={safFileInputRef}
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleSafFileSelect(f);
                }}
              />
              <button
                type="button"
                disabled={isImportingSaf}
                onClick={() => safFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                title="Upload SAF Excel to match and update registrations"
              >
                <span>{isImportingSaf ? "⏳" : "📊"}</span>
                <span>{isImportingSaf ? "Processing…" : "Import & Match SAF Excel"}</span>
              </button>

              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    ({selectedIds.length} selected)
                  </span>
                  <button
                    type="button"
                    onClick={removeSelected}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-xs cursor-pointer"
                  >
                    🗑️ Delete ({selectedIds.length})
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setSortDesc((v) => !v)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border/60 hover:bg-muted text-foreground transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>Sort:</span>
                  <span className="font-bold text-primary">{sortDesc ? "Newest" : "Oldest"}</span>
                </button>

                <span className="text-border px-0.5">|</span>

                <select
                  className="bg-transparent border-0 py-1 pl-1 pr-5 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-0 cursor-pointer"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                >
                  {PAGE_SIZES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border text-xs">
                <button
                  type="button"
                  disabled={page === 0 || pageSize === -1}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center justify-center h-7 px-2.5 text-xs font-semibold rounded-lg bg-card border border-border/60 text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
                >
                  ← Prev
                </button>
                <span className="px-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {pageSize === -1 ? (
                    <>
                      All <strong className="text-foreground font-bold">{total}</strong> Records
                    </>
                  ) : (
                    <>
                      Page <strong className="text-foreground font-bold">{page + 1}</strong> of <strong className="text-foreground font-bold">{pageCount}</strong>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= pageCount || pageSize === -1}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center justify-center h-7 px-2.5 text-xs font-semibold rounded-lg bg-card border border-border/60 text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {listQuery.isError ? (
            <p className="mt-3 text-xs sm:text-sm text-destructive font-semibold">
              ⚠️ Could not load records. Your account may not have admin access yet.
            </p>
          ) : null}
        </section>

        {/* ── 4. Main Records Table Card ────────────────────────────────────── */}
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs overflow-hidden">
          <div className="overflow-x-auto rounded-xl border border-border/70 shadow-2xs bg-card">
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
                        let cellVal = r[c.key];
                        // Show status in Admin Notes when notes are empty
                        if (c.key === "admin_notes" && (cellVal === null || cellVal === undefined || cellVal === "")) {
                          cellVal = r["status"] || "Pending";
                        }
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
                        <div className="flex items-center gap-2">
                          {/* Current Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold shadow-2xs ${curStatus === "Approved"
                                ? "bg-emerald-600 text-white"
                                : curStatus === "Sent to Department"
                                  ? "bg-sky-600 text-white"
                                  : curStatus === "Approved by Dept"
                                    ? "bg-indigo-600 text-white"
                                    : curStatus === "Rejected"
                                      ? "bg-red-600 text-white"
                                      : curStatus === "Pending Document"
                                        ? "bg-amber-600 text-white"
                                        : "bg-primary/15 text-primary border border-primary/20"
                              }`}
                          >
                            {curStatus === "Approved"
                              ? "✓ Approved"
                              : curStatus === "Sent to Department"
                                ? "📤 Sent to Dept"
                                : curStatus === "Approved by Dept"
                                  ? "🏛️ Approved by Dept"
                                  : curStatus === "Rejected"
                                    ? "✕ Rejected"
                                    : curStatus === "Pending Document"
                                      ? "📄 Pending Doc"
                                      : "⏳ Pending"}
                          </span>

                          {/* 1-Click Fast Workflow Step Actions */}
                          {curStatus === "Pending" && (
                            <button
                              type="button"
                              onClick={() => requestStatusChange(r, "Approved")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                              title="Step 1: Admin Approval"
                            >
                              ✓ Approve
                            </button>
                          )}
                          {curStatus === "Approved" && (
                            <button
                              type="button"
                              onClick={() => requestStatusChange(r, "Sent to Department")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer animate-pulse"
                              title="Step 2: Forward to Department"
                            >
                              📤 Sent to Dept →
                            </button>
                          )}
                          {curStatus === "Sent to Department" && (
                            <button
                              type="button"
                              onClick={() => requestStatusChange(r, "Approved by Dept")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer animate-pulse"
                              title="Step 3: Department Final Approval"
                            >
                              🏛️ Approved by Dept →
                            </button>
                          )}
                          {(curStatus === "Rejected" || curStatus === "Pending Document") && (
                            <button
                              type="button"
                              onClick={() => requestStatusChange(r, "Approved")}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline transition-colors cursor-pointer"
                              title="Re-evaluate & Approve"
                            >
                              Re-evaluate
                            </button>
                          )}

                          {/* Quick Change Selector */}
                          <select
                            value={curStatus}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val && val !== curStatus) {
                                requestStatusChange(r, val);
                              }
                            }}
                            className="h-7 px-2 text-xs font-semibold rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            title="Change status for this applicant"
                          >
                            <option value="" disabled>Change Status...</option>
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st === curStatus ? `✓ ${st} (Current)` : `Change to ${st}`}
                              </option>
                            ))}
                          </select>
                        </div>
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
            void qc.invalidateQueries({ queryKey: ["registrations"] });
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

            {statusTarget.status === "Sent to Department" && (
              <div className="mt-4 rounded-lg bg-sky-500/10 p-3 border border-sky-500/20 text-xs">
                <span className="font-semibold text-sky-900 block mb-1">
                  Department Remarks:
                </span>
                <span className="font-medium text-sky-800">
                  Forwarded for verification
                </span>
              </div>
            )}

            {statusTarget.status === "Approved by Dept" && (
              <div className="mt-4 rounded-lg bg-indigo-500/10 p-3 border border-indigo-500/20 text-xs">
                <span className="font-semibold text-indigo-900 block mb-1">
                  Department Remarks:
                </span>
                <span className="font-medium text-indigo-800">
                  Verified &amp; Approved by Dept
                </span>
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
                    : statusTarget.status === "Sent to Department"
                      ? "bg-sky-600 hover:bg-sky-700"
                      : statusTarget.status === "Approved by Dept"
                        ? "bg-indigo-600 hover:bg-indigo-700"
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

      {safConfirmModalOpen && pendingSafData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 text-xl font-bold">
                📊
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Confirm SAF Excel Upload</h3>
                <p className="text-xs text-muted-foreground">Admin authorization required</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-lg bg-muted/40 p-3.5 border border-border text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Selected File:</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]" title={pendingSafData.file.name}>
                  {pendingSafData.file.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Total Rows to Match:</span>
                <span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {pendingSafData.totalRows} Student Record(s)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Matching Rule:</span>
                <span className="font-semibold text-emerald-700">Ref ID + Aadhaar (Exact)</span>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Enter Admin Password to Proceed:
              </label>
              <input
                type="password"
                placeholder="Enter password..."
                value={safPassword}
                onChange={(e) => {
                  setSafPassword(e.target.value);
                  setSafPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void processSafImport();
                }}
                className="w-full form-ctrl text-xs h-9"
                autoFocus
              />
              {safPasswordError && (
                <p className="text-xs text-destructive font-medium mt-1">⚠️ {safPasswordError}</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isImportingSaf}
                onClick={() => {
                  setSafConfirmModalOpen(false);
                  setPendingSafData(null);
                  setSafPassword("");
                  setSafPasswordError("");
                }}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImportingSaf || !safPassword}
                onClick={() => void processSafImport()}
                className="px-4 py-2 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <span>{isImportingSaf ? "⏳" : "✓"}</span>
                <span>{isImportingSaf ? "Updating Records…" : "Verify & Update SAF Numbers"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {safImportModalOpen && safImportReport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-xl bg-card p-6 shadow-2xl border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="text-base font-bold text-foreground">SAF Excel Import &amp; Match Report</h3>
                  <p className="text-xs text-muted-foreground">Reconciliation summary</p>
                </div>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => setSafImportModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="text-xl font-bold text-emerald-600">{safImportReport.updated}</div>
                <div className="text-xs font-semibold text-emerald-700">Updated</div>
              </div>
              <div className="rounded-lg bg-sky-500/10 border border-sky-500/20 p-3">
                <div className="text-xl font-bold text-sky-600">{safImportReport.unchanged}</div>
                <div className="text-xs font-semibold text-sky-700">Already Current</div>
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <div className="text-xl font-bold text-red-600">{safImportReport.unmatched.length}</div>
                <div className="text-xs font-semibold text-red-700">Unmatched / Errors</div>
              </div>
            </div>

            {safImportReport.unmatched.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-destructive">
                  Unmatched records (not updated):
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/30 p-2 text-xs divide-y divide-border/60">
                  {safImportReport.unmatched.map((u, i) => (
                    <div key={i} className="py-1.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-foreground">{u.name || "Unknown"}</span>{" "}
                        <span className="text-muted-foreground">(Ref: {u.ref || "N/A"}, Aadhaar: {u.aadhaar || "N/A"})</span>
                      </div>
                      <span className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {u.saf}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSafImportModalOpen(false)}
                className="btn-kk btn-primary-kk text-xs px-4 py-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  percent,
  badgeText,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  value: number;
  percent?: string;
  badgeText?: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl border bg-card p-4 sm:p-4.5 transition-all duration-200 select-none flex flex-col justify-between ${
        onClick ? "cursor-pointer" : ""
      } ${
        isActive
          ? "border-primary ring-2 ring-primary/25 bg-primary/[0.03] shadow-sm"
          : "border-border/80 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Header: Large, bold, readable label on left & styled neutral icon on right */}
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-sm sm:text-[15px] font-bold text-foreground/90 group-hover:text-foreground tracking-tight line-clamp-1 transition-colors">
          {label}
        </span>
        <div
          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
            isActive
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-muted/80 text-muted-foreground border-border/60 group-hover:bg-muted group-hover:text-foreground group-hover:border-border"
          }`}
        >
          {icon}
        </div>
      </div>

      {/* Main Metric & Status Badge */}
      <div className="mt-3.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground tabular-nums">
          {value.toLocaleString()}
        </span>

        {isActive ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shrink-0 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
            <span>Active</span>
          </span>
        ) : badgeText ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/70 shrink-0">
            {badgeText}
          </span>
        ) : percent ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums bg-muted text-muted-foreground border border-border/70 shrink-0">
            {percent}
          </span>
        ) : null}
      </div>

      {/* Bottom Filter Prompt */}
      {onClick && (
        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground font-semibold transition-colors">
          <span className="text-[11px]">Filter records</span>
          <span className="text-xs group-hover:translate-x-1 transition-transform text-muted-foreground group-hover:text-primary">→</span>
        </div>
      )}
    </div>
  );
}

function Breakdown({
  title,
  data,
  limit = 5,
  barColor = "bg-primary",
  activeValue,
  onItemClick,
}: {
  title: string;
  data: Record<string, number>;
  limit?: number;
  barColor?: string;
  activeValue?: string;
  onItemClick?: (key: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const allEntries = useMemo(
    () => Object.entries(data).sort((a, b) => b[1] - a[1]),
    [data],
  );
  const entries = showAll ? allEntries : allEntries.slice(0, limit);
  const max = allEntries[0]?.[1] ?? 1;

  return (
    <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200">
      <div>
        <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-border/40">
          <h2 className="text-xs font-semibold text-foreground tracking-tight truncate">
            {title}
          </h2>
          {activeValue ? (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
              Filtered ✓
            </span>
          ) : null}
        </div>
        {allEntries.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No records found.</p>
        ) : null}
        <ul className="mt-2 space-y-1.5 max-h-[145px] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]">
          {entries.map(([k, v]) => {
            const isActive = !!activeValue && activeValue.toLowerCase() === k.toLowerCase();
            return (
              <li
                key={k}
                onClick={() => onItemClick?.(k)}
                className={`group/item rounded-md p-1 px-1.5 transition-all overflow-hidden ${
                  onItemClick ? "cursor-pointer hover:bg-muted/70" : ""
                } ${
                  isActive ? "bg-primary/10 ring-1 ring-primary/30 font-semibold" : ""
                }`}
                title={onItemClick ? `Click to filter by: ${k}` : undefined}
              >
                <div className="flex justify-between text-[11px] items-center gap-1.5 min-w-0">
                  <span
                    className={`truncate min-w-0 flex-1 transition-colors ${
                      isActive ? "text-primary font-semibold" : "text-foreground font-medium group-hover/item:text-foreground"
                    }`}
                  >
                    {isActive && <span className="mr-1 text-primary">✓</span>}
                    {k}
                  </span>
                  <span className={`shrink-0 tabular-nums text-[11px] ${isActive ? "text-primary font-bold" : "font-semibold text-muted-foreground"}`}>
                    {v}
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-1 rounded-full ${barColor} transition-all duration-300`}
                    style={{ width: `${Math.max(4, (v / max) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      {allEntries.length > 0 && (
        <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10.5px] text-muted-foreground font-medium">
          <span>Total: <strong className="text-foreground font-semibold">{allEntries.length}</strong></span>
          {allEntries.length > limit ? (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="text-[10.5px] font-semibold text-primary hover:underline cursor-pointer transition-colors"
            >
              {showAll ? "Collapse" : "View All"}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function GenderDonut({
  data,
  activeGender,
  onItemClick,
}: {
  data: Record<string, number>;
  activeGender?: string;
  onItemClick?: (gender: string) => void;
}) {
  const female = data["Female"] ?? 0;
  const male = data["Male"] ?? 0;
  const other = data["Other"] ?? 0;
  const total = female + male + other;

  const radius = 36;
  const circumference = 2 * Math.PI * radius; // ~226.19

  const femalePercent = total > 0 ? (female / total) * 100 : 0;
  const malePercent = total > 0 ? (male / total) * 100 : 0;
  const otherPercent = total > 0 ? (other / total) * 100 : 0;

  const femaleDash = (femalePercent / 100) * circumference;
  const maleDash = (malePercent / 100) * circumference;
  const otherDash = (otherPercent / 100) * circumference;

  const femaleOffset = 0;
  const maleOffset = -femaleDash;
  const otherOffset = -(femaleDash + maleDash);

  const isFemaleActive = activeGender === "Female";
  const isMaleActive = activeGender === "Male";
  const isOtherActive = activeGender === "Other";

  return (
    <div className="rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200">
      <div>
        <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
          <h2 className="text-xs font-semibold text-foreground">
            By Gender
          </h2>
          {activeGender ? (
            <span className="text-[10px] font-semibold text-primary">Filtered ({activeGender})</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">Distribution</span>
          )}
        </div>

        <div className="my-2 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <svg className="h-18 w-18 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-muted"
                strokeWidth="14"
                stroke="currentColor"
                fill="transparent"
              />
              {female > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#475569"
                  strokeWidth="14"
                  strokeDasharray={`${femaleDash} ${circumference}`}
                  strokeDashoffset={femaleOffset}
                  fill="transparent"
                  className="transition-all duration-500 cursor-pointer hover:opacity-80"
                  onClick={() => onItemClick?.("Female")}
                />
              )}
              {male > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#94A3B8"
                  strokeWidth="14"
                  strokeDasharray={`${maleDash} ${circumference}`}
                  strokeDashoffset={maleOffset}
                  fill="transparent"
                  className="transition-all duration-500 cursor-pointer hover:opacity-80"
                  onClick={() => onItemClick?.("Male")}
                />
              )}
              {other > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#CBD5E1"
                  strokeWidth="14"
                  strokeDasharray={`${otherDash} ${circumference}`}
                  strokeDashoffset={otherOffset}
                  fill="transparent"
                  className="transition-all duration-500 cursor-pointer hover:opacity-80"
                  onClick={() => onItemClick?.("Other")}
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-sm font-bold text-foreground tabular-nums leading-none">{total}</span>
              <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-0.5">
          <div
            onClick={() => onItemClick?.("Female")}
            className={`flex items-center justify-between text-[11px] cursor-pointer p-1 px-1.5 rounded transition-colors ${
              isFemaleActive ? "bg-primary/10 ring-1 ring-primary/30 font-semibold text-primary" : "hover:bg-muted/70 text-foreground"
            }`}
            title="Filter by Female"
          >
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-600 dark:bg-slate-400" />
              <span>Female</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold tabular-nums">{female}</span>
              <span className="text-[10px] text-muted-foreground">({femalePercent.toFixed(0)}%)</span>
            </div>
          </div>

          <div
            onClick={() => onItemClick?.("Male")}
            className={`flex items-center justify-between text-[11px] cursor-pointer p-1 px-1.5 rounded transition-colors ${
              isMaleActive ? "bg-primary/10 ring-1 ring-primary/30 font-semibold text-primary" : "hover:bg-muted/70 text-foreground"
            }`}
            title="Filter by Male"
          >
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              <span>Male</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold tabular-nums">{male}</span>
              <span className="text-[10px] text-muted-foreground">({malePercent.toFixed(0)}%)</span>
            </div>
          </div>

          {other > 0 && (
            <div
              onClick={() => onItemClick?.("Other")}
              className={`flex items-center justify-between text-[11px] cursor-pointer p-1 px-1.5 rounded transition-colors ${
                isOtherActive ? "bg-primary/10 ring-1 ring-primary/30 font-semibold text-primary" : "hover:bg-muted/70 text-foreground"
              }`}
              title="Filter by Other"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>Other</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold tabular-nums">{other}</span>
                <span className="text-[10px] text-muted-foreground">({otherPercent.toFixed(0)}%)</span>
              </div>
            </div>
          )}
        </div>
      </div>
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
  const isSelected = !!value;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-muted-foreground tracking-tight flex items-center justify-between">
        <span>{label}</span>
        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </label>
      <select
        className={`form-ctrl text-xs h-9.5 rounded-xl border transition-all ${isSelected
            ? "border-primary ring-1 ring-primary/20 bg-primary/[0.02] font-semibold text-foreground"
            : "border-border/80 bg-background text-foreground hover:border-border"
          }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All {label}</option>
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
      {/* Step-by-Step Approval Track */}
      <div className="border-b border-border py-3 bg-muted/20 px-3.5 rounded-lg mt-2 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Current Status:</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${curStatus === "Approved"
                  ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                  : curStatus === "Sent to Department"
                    ? "bg-sky-500/15 text-sky-700 border border-sky-500/30"
                    : curStatus === "Approved by Dept"
                      ? "bg-indigo-500/15 text-indigo-700 border border-indigo-500/30"
                      : curStatus === "Rejected"
                        ? "bg-red-500/15 text-red-700 border border-red-500/30"
                        : curStatus === "Pending Document"
                          ? "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                          : "bg-primary/10 text-primary border border-primary/20"
                }`}
            >
              {curStatus === "Sent to Department"
                ? "📤 Sent to Department"
                : curStatus === "Approved by Dept"
                  ? "🏛️ Approved by Dept"
                  : curStatus}
            </span>
            {row["admin_notes"] && (
              <span className="text-xs text-muted-foreground italic truncate max-w-[240px]" title={row["admin_notes"]}>
                ({row["admin_notes"]})
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {curStatus === "Pending" && (
              <button
                type="button"
                onClick={() => onAction(row, "Approved")}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                ✓ Step 1: Approve (Admin)
              </button>
            )}
            {curStatus === "Approved" && (
              <button
                type="button"
                onClick={() => onAction(row, "Sent to Department")}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors cursor-pointer animate-pulse"
              >
                📤 Step 2: Sent to Department →
              </button>
            )}
            {curStatus === "Sent to Department" && (
              <button
                type="button"
                onClick={() => onAction(row, "Approved by Dept")}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer animate-pulse"
              >
                🏛️ Step 3: Approved by Dept →
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
                📄 Pending Doc
              </button>
            )}
          </div>
        </div>

        {/* Visual 3-Stage Progress Tracker */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div
            className={`p-1.5 rounded text-[11px] font-semibold border ${curStatus === "Approved" || curStatus === "Sent to Department" || curStatus === "Approved by Dept"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700"
                : "bg-muted/40 border-border text-muted-foreground"
              }`}
          >
            1. Admin Approved {curStatus === "Approved" || curStatus === "Sent to Department" || curStatus === "Approved by Dept" ? "✓" : ""}
          </div>
          <div
            className={`p-1.5 rounded text-[11px] font-semibold border ${curStatus === "Sent to Department" || curStatus === "Approved by Dept"
                ? "bg-sky-500/15 border-sky-500/40 text-sky-700"
                : "bg-muted/40 border-border text-muted-foreground"
              }`}
          >
            2. Sent to Dept {curStatus === "Sent to Department" || curStatus === "Approved by Dept" ? "✓" : ""}
          </div>
          <div
            className={`p-1.5 rounded text-[11px] font-semibold border ${curStatus === "Approved by Dept"
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-700"
                : "bg-muted/40 border-border text-muted-foreground"
              }`}
          >
            3. Dept Approved {curStatus === "Approved by Dept" ? "✓" : ""}
          </div>
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

function SearchableDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    const starts: string[] = [];
    const contains: string[] = [];
    for (const opt of options) {
      const lower = opt.toLowerCase();
      if (lower.startsWith(q)) {
        starts.push(opt);
      } else if (lower.includes(q)) {
        contains.push(opt);
      }
    }
    return [...starts, ...contains];
  }, [search, options]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="form-ctrl text-xs text-left flex items-center justify-between gap-2 cursor-pointer"
      >
        <span className="truncate">{value || `Select ${label}...`}</span>
        <span className="text-[10px] text-muted-foreground shrink-0">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] max-w-[340px] rounded-md border border-border bg-popover p-1.5 shadow-xl text-popover-foreground">
          <div className="relative mb-1">
            <input
              ref={inputRef}
              type="text"
              className="form-ctrl text-xs py-1 px-2 pr-6 w-full"
              placeholder={`Search ${label}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-0.5"
              >
                ✕
              </button>
            )}
          </div>
          <ul className="max-h-56 overflow-y-auto space-y-0.5 text-xs">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <li
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`px-2 py-1.5 rounded cursor-pointer transition-colors ${opt === value
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  {opt}
                </li>
              ))
            ) : (
              <li className="px-2 py-2 text-center text-muted-foreground italic">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function EditDialog({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, unknown>>({
    ...row,
    institution_name: normalizeCollegeName(row["institution_name"] as string) || row["institution_name"],
  });
  const [busy, setBusy] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const visibleColumns = COLUMNS.filter((c) => c.key !== "created_at" && shouldShowField(c.key, form as Row));
  const groups = [...new Set(visibleColumns.map((c) => c.group))];

  const handleFileUpload = async (key: string, file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be less than 5 MB");
      return;
    }
    setUploadingKey(key);
    try {
      const fileExt = file.name.split(".").pop();
      const randomId = Math.random().toString(36).substring(2, 15);
      const safeName = file.name.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${randomId}_${Date.now()}_${safeName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("registrations")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("registrations")
        .getPublicUrl(fileName);

      setForm((f) => ({ ...f, [key]: publicUrl }));
      toast.success("File uploaded successfully");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleCasteChange = (selectedCaste: string) => {
    const info = CASTES.find((c) => c.name === selectedCaste);
    setForm((f) => {
      const updated: Record<string, unknown> = { ...f, caste: selectedCaste };
      if (info) {
        if (info.nigama) updated.nigama = info.nigama;
        if (info.category) updated.caste_sub_category = info.category;
      }
      return updated;
    });
  };

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
      if (c.key === "institution_name") {
        v = normalizeCollegeName(v as string) || v;
      }
      if (c.type === "array") {
        v = Array.isArray(v)
          ? v
          : typeof v === "string"
            ? v.split(",").map((s) => s.trim()).filter(Boolean)
            : [];
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
    <Dialog title={`Edit Registration — ${form["first_name"] || ""} ${form["last_name"] || ""}`} onClose={onClose}>
      <div className="mt-3 max-h-[68vh] space-y-5 overflow-y-auto pr-2">
        {groups.map((g) => (
          <div key={g} className="bg-muted/10 p-3 rounded-lg border border-border/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1.5 mb-3">{g}</h3>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleColumns.filter((c) => c.group === g).map((c) => {
                const raw = form[c.key];
                const value = Array.isArray(raw) ? raw.join(", ") : raw == null ? "" : String(raw);

                // Compute dynamic options for contextual fields
                let dynamicOptions = c.options ? [...c.options] : undefined;
                if (c.key === "caste") {
                  dynamicOptions = [...CASTE_NAMES];
                } else if (c.key === "nigama") {
                  dynamicOptions = [...NIGAMAS];
                } else if (c.key === "caste_sub_category") {
                  dynamicOptions = [...CASTE_CATEGORIES];
                } else if (c.key === "cur_district" && String(form["cur_state"]).toUpperCase() === "KARNATAKA") {
                  dynamicOptions = [...(DISTRICTS["KARNATAKA"] ?? [])];
                } else if (c.key === "per_district" && String(form["per_state"]).toUpperCase() === "KARNATAKA") {
                  dynamicOptions = [...(DISTRICTS["KARNATAKA"] ?? [])];
                } else if (c.key === "cur_taluk") {
                  const dist = String(form["cur_district"] ?? "").toUpperCase().trim();
                  if (dist && TALUKS[dist]) {
                    dynamicOptions = [...TALUKS[dist]];
                  }
                } else if (c.key === "per_taluk") {
                  const dist = String(form["per_district"] ?? "").toUpperCase().trim();
                  if (dist && TALUKS[dist]) {
                    dynamicOptions = [...TALUKS[dist]];
                  }
                } else if (c.key === "stream") {
                  const edu = String(form["education"] ?? "").trim();
                  if (edu && STREAMS[edu]) {
                    dynamicOptions = [...STREAMS[edu]];
                  }
                } else if (c.key === "subject") {
                  const st = String(form["stream"] ?? "").trim();
                  if (st && SUBJECTS[st]) {
                    dynamicOptions = [...SUBJECTS[st]];
                  }
                }

                // If existing value is not in options, keep it selectable
                if (dynamicOptions && value && !dynamicOptions.includes(value)) {
                  dynamicOptions = [value, ...dynamicOptions];
                }

                const isDocument =
                  (c.group === "Documents" ||
                    c.key.endsWith("_proof") ||
                    c.key === "profile_image") &&
                  c.type !== "bool";

                const getDisplayFileName = (url: string) => {
                  if (!url) return "";
                  try {
                    const parsed = new URL(url);
                    const parts = parsed.pathname.split("/");
                    const last = decodeURIComponent(parts[parts.length - 1] || "");
                    return last.replace(/^[a-z0-9]+_\d+_/, "") || last;
                  } catch {
                    const parts = url.split("/");
                    const last = parts[parts.length - 1] || "";
                    return last.replace(/^[a-z0-9]+_\d+_/, "") || url;
                  }
                };

                return (
                  <div key={c.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-xs font-semibold text-foreground">{c.label}</label>
                    </div>

                    {isDocument ? (
                      <div className="rounded-md border border-border/80 bg-background/60 p-2 space-y-2 shadow-xs">
                        {value ? (
                          <div className="flex items-center justify-between gap-2 bg-muted/40 p-1.5 px-2.5 rounded border border-border/60">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="text-xs">📎</span>
                              <a
                                href={value}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-medium text-primary hover:underline truncate"
                                title={value}
                              >
                                {getDisplayFileName(value)}
                              </a>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={value}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded transition-colors"
                              >
                                View ↗
                              </a>
                              <label
                                className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-foreground bg-muted hover:bg-muted/80 border border-border rounded cursor-pointer transition-colors ${uploadingKey === c.key ? "opacity-50 pointer-events-none" : ""
                                  }`}
                              >
                                {uploadingKey === c.key ? "Uploading..." : "Replace"}
                                <input
                                  type="file"
                                  className="sr-only"
                                  accept="image/*,application/pdf"
                                  disabled={uploadingKey === c.key}
                                  onChange={(e) => void handleFileUpload(c.key, e.target.files?.[0])}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, [c.key]: "" }))}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 rounded transition-colors cursor-pointer"
                                title="Delete document reference"
                              >
                                Delete ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <label
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary rounded-md text-xs font-semibold cursor-pointer transition-all ${uploadingKey === c.key ? "opacity-50 pointer-events-none" : ""
                                }`}
                            >
                              <span>{uploadingKey === c.key ? "⏳ Uploading file..." : "📤 Choose File to Upload"}</span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*,application/pdf"
                                disabled={uploadingKey === c.key}
                                onChange={(e) => void handleFileUpload(c.key, e.target.files?.[0])}
                              />
                            </label>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider shrink-0">URL:</span>
                          <input
                            className="form-ctrl text-[11px] h-7 truncate flex-1 font-mono bg-background"
                            type="text"
                            value={value}
                            onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                            placeholder="Or paste direct URL / Google Drive link..."
                          />
                        </div>
                      </div>
                    ) : c.key === "languages_known" ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {LANGUAGES_KNOWN.map((lang) => {
                          const list = Array.isArray(raw)
                            ? (raw as string[])
                            : typeof raw === "string"
                              ? raw.split(",").map((s) => s.trim()).filter(Boolean)
                              : [];
                          const checked = list.includes(lang);
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => {
                                const next = checked ? list.filter((l) => l !== lang) : [...list, lang];
                                setForm((f) => ({ ...f, [c.key]: next }));
                              }}
                              className={`px-2 py-0.5 text-xs rounded-full border transition-colors cursor-pointer ${checked
                                  ? "bg-primary text-primary-foreground border-primary font-medium"
                                  : "bg-background border-border text-muted-foreground hover:border-primary/50"
                                }`}
                            >
                              {lang} {checked ? "✓" : "+"}
                            </button>
                          );
                        })}
                      </div>
                    ) : c.key === "caste" ? (
                      <SearchableDropdown
                        label={c.label}
                        value={value}
                        options={CASTE_NAMES}
                        onChange={(selectedCaste) => handleCasteChange(selectedCaste)}
                      />
                    ) : dynamicOptions ? (
                      <select
                        className="form-ctrl text-xs"
                        value={value}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (c.key === "education") {
                            // If education changes, reset stream and subject if invalid
                            const validStreams = STREAMS[val] ?? [];
                            setForm((f) => ({
                              ...f,
                              education: val,
                              stream: validStreams.includes(f["stream"] as string) ? f["stream"] : "",
                              subject: "",
                            }));
                          } else if (c.key === "stream") {
                            const validSubjects = SUBJECTS[val] ?? [];
                            setForm((f) => ({
                              ...f,
                              stream: val,
                              subject: validSubjects.includes(f["subject"] as string) ? f["subject"] : "",
                            }));
                          } else if (c.key === "cur_district") {
                            setForm((f) => ({
                              ...f,
                              cur_district: val,
                              cur_taluk: "",
                            }));
                          } else if (c.key === "per_district") {
                            setForm((f) => ({
                              ...f,
                              per_district: val,
                              per_taluk: "",
                            }));
                          } else {
                            setForm((f) => ({ ...f, [c.key]: val }));
                          }
                        }}
                      >
                        <option value="">Select {c.label}...</option>
                        {dynamicOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : c.type === "bool" ? (
                      <select
                        className="form-ctrl text-xs"
                        value={raw ? "Yes" : "No"}
                        onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value === "Yes" }))}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      <input
                        className="form-ctrl text-xs"
                        type={c.type === "date" ? "date" : "text"}
                        value={c.type === "date" ? value.slice(0, 10) : value}
                        onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                        placeholder={`Enter ${c.label}...`}
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
        <button className="btn-kk btn-primary-kk" onClick={() => void save()} disabled={busy || !!uploadingKey}>
          {busy ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Dialog>
  );
}
