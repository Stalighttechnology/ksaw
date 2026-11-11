import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { utils, writeFile } from "xlsx";
import {
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Filter,
  LogOut,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

import { SiteHeader } from "@/components/reg/SiteChrome";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { MARKS_PER_QUESTION, SAMPLE_ASSESSMENT_QUESTIONS } from "@/lib/assessmentQuestions";
import { formatDuration } from "@/lib/assessmentStorage";

type AssessmentRow = Database["public"]["Tables"]["amrutha_munnade_assessment"]["Row"];

type AnswerDetail = {
  questionNumber?: number;
  section?: string;
  selectedIndex?: number;
  selectedOption?: string | null;
  isCorrect?: boolean;
};

type SortKey =
  | "submitted_at"
  | "candidate_name"
  | "saf_id"
  | "college_name"
  | "attempted_count"
  | "correct_count"
  | "score_percentage"
  | "time_taken_seconds";

type ScoreBand = "all" | "80plus" | "60to79" | "40to59" | "below40";

const SCORE_BAND_OPTIONS: readonly { id: ScoreBand; label: string }[] = [
  { id: "all", label: "All Scores" },
  { id: "80plus", label: "40–50 Marks (80%+)" },
  { id: "60to79", label: "30–39 Marks (60–79%)" },
  { id: "40to59", label: "20–29 Marks (40–59%)" },
  { id: "below40", label: "Below 20 Marks (<40%)" },
];

const PAGE_SIZES = [10, 25, 50, 100] as const;

const title = "Computer Programming Assessment | Admin Dashboard";
const description =
  "Browse, filter, inspect answers, and export Computer Programming Assessment results.";

export const Route = createFileRoute("/_authenticated/assessment/admin")({
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
  component: AssessmentAdminPage,
});

function AssessmentAdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [scoreBand, setScoreBand] = useState<ScoreBand>("all");
  const [reasonFilter, setReasonFilter] = useState<"all" | "manual" | "timeout">("all");
  const [sortKey, setSortKey] = useState<SortKey>("submitted_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);

  const [selectedRow, setSelectedRow] = useState<AssessmentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssessmentRow | null>(null);

  const {
    data: rows = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["amrutha_munnade_assessment"],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from("amrutha_munnade_assessment")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (fetchError) throw fetchError;
      return data ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: delError } = await supabase
        .from("amrutha_munnade_assessment")
        .delete()
        .eq("id", id);
      if (delError) throw delError;
    },
    onSuccess: () => {
      toast.success("Assessment record deleted.");
      setDeleteTarget(null);
      void qc.invalidateQueries({ queryKey: ["amrutha_munnade_assessment"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete record.");
    },
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({
      to: "/auth",
      search: { redirect: "/assessment/admin" },
      replace: true,
    });
  };

  const collegeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const c = r.college_name.trim();
      if (c) map.set(c, (map.get(c) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  const collegesList = useMemo(() => {
    return Array.from(collegeCounts.keys()).sort((a, b) => a.localeCompare(b));
  }, [collegeCounts]);

  const hasActiveFilters = Boolean(
    search.trim() || collegeFilter !== "all" || scoreBand !== "all" || reasonFilter !== "all",
  );

  const resetAllFilters = () => {
    setSearch("");
    setCollegeFilter("all");
    setScoreBand("all");
    setReasonFilter("all");
    setPage(0);
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = rows.filter((r) => {
      if (collegeFilter !== "all" && r.college_name.trim() !== collegeFilter) {
        return false;
      }
      if (reasonFilter !== "all" && r.submission_reason !== reasonFilter) {
        return false;
      }

      const marks = r.correct_count * MARKS_PER_QUESTION;
      if (scoreBand === "80plus" && marks < 40) return false;
      if (scoreBand === "60to79" && (marks < 30 || marks >= 40)) return false;
      if (scoreBand === "40to59" && (marks < 20 || marks >= 30)) return false;
      if (scoreBand === "below40" && marks >= 20) return false;

      if (!q) return true;
      return (
        r.candidate_name.toLowerCase().includes(q) ||
        r.saf_id.toLowerCase().includes(q) ||
        r.college_name.toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const mul = sortOrder === "asc" ? 1 : -1;
      switch (sortKey) {
        case "candidate_name":
          return a.candidate_name.localeCompare(b.candidate_name) * mul;
        case "saf_id":
          return a.saf_id.localeCompare(b.saf_id) * mul;
        case "college_name":
          return a.college_name.localeCompare(b.college_name) * mul;
        case "attempted_count":
          return (a.attempted_count - b.attempted_count) * mul;
        case "correct_count":
          return (a.correct_count - b.correct_count) * mul;
        case "score_percentage":
          return (Number(a.score_percentage) - Number(b.score_percentage)) * mul;
        case "time_taken_seconds":
          return (a.time_taken_seconds - b.time_taken_seconds) * mul;
        case "submitted_at":
        default:
          return (new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()) * mul;
      }
    });

    return sorted;
  }, [rows, search, collegeFilter, scoreBand, reasonFilter, sortKey, sortOrder]);

  const totalCount = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedRows = useMemo(() => {
    const start = safePage * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, safePage, pageSize]);

  const stats = useMemo(() => {
    const count = filteredAndSorted.length;
    if (count === 0) {
      return {
        count: 0,
        avgMarks: 0,
        avgPercent: 0,
        highestMarks: 0,
        collegesCount: 0,
      };
    }
    let totalCorrect = 0;
    let totalPercent = 0;
    let highestCorrect = 0;
    const distinctColleges = new Set<string>();

    for (const r of filteredAndSorted) {
      totalCorrect += r.correct_count;
      totalPercent += Number(r.score_percentage);
      if (r.correct_count > highestCorrect) highestCorrect = r.correct_count;
      if (r.college_name.trim()) distinctColleges.add(r.college_name.trim().toLowerCase());
    }

    return {
      count,
      avgMarks: Number(((totalCorrect / count) * MARKS_PER_QUESTION).toFixed(1)),
      avgPercent: Number((totalPercent / count).toFixed(1)),
      highestMarks: highestCorrect * MARKS_PER_QUESTION,
      collegesCount: distinctColleges.size,
    };
  }, [filteredAndSorted]);

  const handleExportExcel = () => {
    if (filteredAndSorted.length === 0) {
      toast.info("No assessment records to export.");
      return;
    }

    const exportData = filteredAndSorted.map((r, index) => ({
      "Sl. No": index + 1,
      "Candidate Name": r.candidate_name,
      "SAF ID": r.saf_id,
      "College / Center Name": r.college_name,
      "Total Questions": r.total_questions,
      Attempted: r.attempted_count,
      Correct: r.correct_count,
      "Marks (out of 50)": r.correct_count * MARKS_PER_QUESTION,
      "Score (%)": Number(r.score_percentage),
      "Time Taken": formatDuration(r.time_taken_seconds),
      "Submission Type": r.submission_reason === "timeout" ? "Auto-Submit (Timeout)" : "Manual",
      "Started At": new Date(r.started_at).toLocaleString(),
      "Submitted At": new Date(r.submitted_at).toLocaleString(),
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Assessment Results");
    const stamp = new Date().toISOString().slice(0, 10);
    writeFile(wb, `computer_programming_assessment_${stamp}.xlsx`);
    toast.success(`Exported ${exportData.length} assessment record(s).`);
  };

  const selectedAnswersMap = useMemo(() => {
    if (!selectedRow || !selectedRow.answers || typeof selectedRow.answers !== "object") {
      return {} as Record<string, AnswerDetail>;
    }
    return selectedRow.answers as Record<string, AnswerDetail>;
  }, [selectedRow]);

  return (
    <div className="kk-page min-h-screen bg-muted/20">
      <SiteHeader variant="admin" />

      <main className="mx-auto w-full max-w-[1680px] space-y-5 px-3 py-4 pb-24 sm:px-6 sm:py-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Computer Programming Assessment — Admin
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                Live Database
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              View, filter, inspect question-by-question responses, and export candidate scores from{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                amrutha_munnade_assessment
              </code>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/assessment"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#EE5D1D] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#D94F12] sm:text-sm"
            >
              <span>Open Assessment</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted disabled:opacity-60 sm:text-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filteredAndSorted.length === 0}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50 sm:text-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={signOut}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs transition-all hover:bg-muted sm:text-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Total Submissions</span>
              <Users className="h-4 w-4 text-[#123A6B]" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
              {stats.count}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Out of {rows.length} total stored
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Average Score</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700 sm:text-3xl">
              {stats.avgMarks} / {SAMPLE_ASSESSMENT_QUESTIONS.length * MARKS_PER_QUESTION}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stats.avgPercent}% average</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Highest Score</span>
              <CheckCircle2 className="h-4 w-4 text-[#EE5D1D]" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
              {stats.highestMarks} / {SAMPLE_ASSESSMENT_QUESTIONS.length * MARKS_PER_QUESTION}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Top marks in filtered view</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Colleges / Centers</span>
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
              {stats.collegesCount}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Participating institutions</p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#123A6B]">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter &amp; Sort Results</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSortKey("submitted_at");
                  setSortOrder("desc");
                  setPage(0);
                }}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  sortKey === "submitted_at" && sortOrder === "desc"
                    ? "border-[#123A6B] bg-[#123A6B] text-white"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                Latest First
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortKey("correct_count");
                  setSortOrder("desc");
                  setPage(0);
                }}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  sortKey === "correct_count" && sortOrder === "desc"
                    ? "border-[#123A6B] bg-[#123A6B] text-white"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                Highest Score
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortKey("correct_count");
                  setSortOrder("asc");
                  setPage(0);
                }}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  sortKey === "correct_count" && sortOrder === "asc"
                    ? "border-[#123A6B] bg-[#123A6B] text-white"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                Lowest Score
              </button>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear Filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
            <div className="flex h-[var(--kk-field-h)] items-center gap-2 rounded border border-[var(--kk-line)] bg-white px-3 focus-within:border-[var(--kk-blue)] focus-within:ring-2 focus-within:ring-[var(--kk-blue)]/15 sm:col-span-2 lg:col-span-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search Name, SAF ID, or College…"
                className="h-full w-full bg-transparent text-sm text-[var(--kk-text)] outline-none placeholder:text-[oklch(0.72_0.01_260)]"
              />
            </div>

            <div className="lg:col-span-4">
              <select
                value={collegeFilter}
                onChange={(e) => {
                  setCollegeFilter(e.target.value);
                  setPage(0);
                }}
                aria-label="Filter by College or Center"
                className="form-ctrl"
              >
                <option value="all">All Colleges / Centers ({rows.length})</option>
                {collegesList.map((college) => (
                  <option key={college} value={college}>
                    {college} ({collegeCounts.get(college) ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={scoreBand}
                onChange={(e) => {
                  setScoreBand(e.target.value as ScoreBand);
                  setPage(0);
                }}
                aria-label="Filter by Score"
                className="form-ctrl"
              >
                {SCORE_BAND_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value as "all" | "manual" | "timeout");
                  setPage(0);
                }}
                aria-label="Filter by Submission Mode"
                className="form-ctrl"
              >
                <option value="all">All Modes</option>
                <option value="manual">Manual Submit</option>
                <option value="timeout">Timeout</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
          {error ? (
            <div className="p-8 text-center text-sm text-destructive">
              Failed to load assessment results:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Loading Computer Programming Assessment results…
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No assessment submissions match your filters yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Candidate Name</th>
                    <th className="px-4 py-3">SAF ID</th>
                    <th className="px-4 py-3">College / Center Name</th>
                    <th className="px-4 py-3">Attempted</th>
                    <th className="px-4 py-3">Marks (/50)</th>
                    <th className="px-4 py-3">Score %</th>
                    <th className="px-4 py-3">Time Taken</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Submitted At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedRows.map((row, idx) => {
                    const marks = row.correct_count * MARKS_PER_QUESTION;
                    const maxMarks = row.total_questions * MARKS_PER_QUESTION;
                    const percent = Number(row.score_percentage);

                    return (
                      <tr key={row.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3 text-muted-foreground">
                          {safePage * pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {row.candidate_name}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#123A6B]">
                          {row.saf_id}
                        </td>
                        <td className="max-w-[260px] px-4 py-3 text-slate-700">
                          {row.college_name}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {row.attempted_count} / {row.total_questions}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums text-emerald-700">
                          {marks} / {maxMarks}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              percent >= 60
                                ? "bg-emerald-100 text-emerald-800"
                                : percent >= 40
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {percent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(row.time_taken_seconds)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${
                              row.submission_reason === "timeout"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {row.submission_reason === "timeout" ? "Timeout" : "Manual"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {new Date(row.submitted_at).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedRow(row)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Answers
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(row)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                              title="Delete attempt"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {totalCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>
                  Showing <strong>{safePage * pageSize + 1}</strong>–
                  <strong>{Math.min((safePage + 1) * pageSize, totalCount)}</strong> of{" "}
                  <strong>{totalCount}</strong>
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                >
                  {PAGE_SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} / page
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="btn-kk btn-cancel-kk h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs font-medium text-muted-foreground">
                  Page {safePage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="btn-kk btn-cancel-kk h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Answer Breakdown Modal */}
      <Dialog open={selectedRow !== null} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="max-h-[85vh] w-[92%] max-w-[92%] overflow-y-auto rounded-xl sm:max-w-3xl">
          {selectedRow ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#123A6B]">
                  {selectedRow.candidate_name} ({selectedRow.saf_id})
                </DialogTitle>
                <DialogDescription>
                  {selectedRow.college_name} • Score:{" "}
                  <strong>
                    {selectedRow.correct_count * MARKS_PER_QUESTION} /{" "}
                    {selectedRow.total_questions * MARKS_PER_QUESTION} marks
                  </strong>{" "}
                  ({selectedRow.correct_count} / {selectedRow.total_questions} correct •{" "}
                  {Number(selectedRow.score_percentage).toFixed(1)}%)
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-3">
                {SAMPLE_ASSESSMENT_QUESTIONS.map((q) => {
                  const ans = selectedAnswersMap[q.id];
                  const selectedIdx =
                    typeof ans?.selectedIndex === "number" ? ans.selectedIndex : undefined;
                  const isAttempted = selectedIdx !== undefined;
                  const isCorrect = isAttempted && selectedIdx === q.correctIndex;
                  const correctOptionText = q.options[q.correctIndex] ?? "";
                  const selectedOptionText =
                    selectedIdx !== undefined
                      ? (q.options[selectedIdx] ?? ans?.selectedOption)
                      : null;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-lg border p-3 text-xs sm:text-sm ${
                        isCorrect
                          ? "border-emerald-200 bg-emerald-50/50"
                          : isAttempted
                            ? "border-red-200 bg-red-50/50"
                            : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          {q.number}. {q.question}
                        </p>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${
                            isCorrect
                              ? "bg-emerald-100 text-emerald-800"
                              : isAttempted
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> +{MARKS_PER_QUESTION}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" /> 0
                            </>
                          )}
                        </span>
                      </div>

                      <div className="mt-1.5 space-y-0.5 text-xs">
                        <p className="text-slate-700">
                          <strong>Selected:</strong>{" "}
                          {selectedOptionText ? selectedOptionText : <em>Not answered</em>}
                        </p>
                        {!isCorrect ? (
                          <p className="text-emerald-800">
                            <strong>Correct Answer:</strong> {correctOptionText}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="w-[90%] max-w-[90%] rounded-xl p-4 sm:max-w-md sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the submission for{" "}
              <strong>{deleteTarget?.candidate_name}</strong> (
              <span className="font-mono font-semibold">{deleteTarget?.saf_id}</span>) from{" "}
              <code>amrutha_munnade_assessment</code> and allow that SAF ID to attempt again if
              needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
