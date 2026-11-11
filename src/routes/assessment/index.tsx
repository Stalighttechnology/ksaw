import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck2,
  GraduationCap,
  Home,
  IdCard,
  Send,
  User,
} from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/reg/SiteChrome";
import { Field, Row, Section, TextField } from "@/components/reg/fields";
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
  ASSESSMENT_DURATION_SECONDS,
  MARKS_PER_QUESTION,
  SAMPLE_ASSESSMENT_QUESTIONS,
} from "@/lib/assessmentQuestions";
import {
  ASSESSMENT_STORAGE_KEY,
  clearAssessmentSession,
  createAssessmentSession,
  formatDuration,
  getRemainingSeconds,
  loadAssessmentSession,
  recordCompletedSafId,
  saveAssessmentSession,
  type AssessmentSession,
} from "@/lib/assessmentStorage";
import {
  checkSafAssessmentCompleted,
  submitAssessmentResultToSupabase,
} from "@/lib/assessmentSubmission";
import { useColleges } from "@/lib/useColleges";

const title = "Computer Programming Assessment | Karnataka State Akkamahadevi Women's University";
const description =
  "Computer Programming Assessment portal with 25 questions, 50 marks, and a 1-hour timed session.";

export const Route = createFileRoute("/assessment/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssessmentPage,
});

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

type FormErrors = {
  candidateName?: string | undefined;
  safId?: string | undefined;
  collegeName?: string | undefined;
};

function AssessmentPage() {
  const { applicantColleges } = useColleges();

  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(ASSESSMENT_DURATION_SECONDS);

  // Pre-assessment candidate form state
  const [candidateName, setCandidateName] = useState("");
  const [safDigits, setSafDigits] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeMenuOpen, setCollegeMenuOpen] = useState(false);
  const [checkingSaf, setCheckingSaf] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Instructions & submit confirmation modals
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const collegeBoxRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const persistSession = useCallback((next: AssessmentSession) => {
    setSession(next);
    saveAssessmentSession(next);
  }, []);

  const syncResultToDatabase = useCallback(
    async (completedSession: AssessmentSession) => {
      if (completedSession.status !== "submitted") return;
      if (completedSession.syncStatus === "synced" || syncingRef.current) return;

      syncingRef.current = true;
      const pendingSession: AssessmentSession = {
        ...completedSession,
        syncStatus: "pending",
        syncError: undefined,
      };
      persistSession(pendingSession);

      const res = await submitAssessmentResultToSupabase(pendingSession);
      syncingRef.current = false;

      if (res.ok) {
        persistSession({
          ...pendingSession,
          syncStatus: "synced",
          syncError: undefined,
        });
      } else {
        persistSession({
          ...pendingSession,
          syncStatus: "failed",
          syncError: res.error,
        });
        toast.error("Submitted locally, but saving to server failed. You can retry below.");
      }
    },
    [persistSession],
  );

  const finalizeSession = useCallback(
    (current: AssessmentSession, reason: "manual" | "timeout") => {
      if (current.status === "submitted") return;
      recordCompletedSafId(current.candidate.safId);
      const completed: AssessmentSession = {
        ...current,
        status: "submitted",
        submittedAt: Date.now(),
        submissionReason: reason,
        syncStatus: "pending",
      };
      persistSession(completed);
      if (reason === "timeout") {
        toast.warning("Time is up! Your assessment has been automatically submitted.");
      } else {
        toast.success("Assessment submitted successfully.");
      }
      void syncResultToDatabase(completed);
    },
    [persistSession, syncResultToDatabase],
  );

  // Hydrate persisted assessment session on mount (survives refresh & browser close/reopen)
  useEffect(() => {
    setMounted(true);
    const saved = loadAssessmentSession();
    if (saved) {
      if (saved.status === "in_progress") {
        const left = getRemainingSeconds(saved.endsAt);
        if (left <= 0) {
          const autoSubmitted: AssessmentSession = {
            ...saved,
            status: "submitted",
            submittedAt: saved.endsAt,
            submissionReason: "timeout",
            syncStatus: "pending",
          };
          setSession(autoSubmitted);
          saveAssessmentSession(autoSubmitted);
          setRemainingSeconds(0);
          void syncResultToDatabase(autoSubmitted);
        } else {
          setSession(saved);
          setRemainingSeconds(left);
        }
      } else {
        setSession(saved);
        setRemainingSeconds(0);
        if (saved.syncStatus !== "synced") {
          void syncResultToDatabase(saved);
        }
      }
    }
  }, [syncResultToDatabase]);

  // Cross-tab synchronization if candidate opens /assessment in multiple tabs
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ASSESSMENT_STORAGE_KEY) return;
      if (!event.newValue) {
        setSession(null);
        setRemainingSeconds(ASSESSMENT_DURATION_SECONDS);
        return;
      }
      const updated = loadAssessmentSession();
      if (updated) {
        setSession(updated);
        setRemainingSeconds(
          updated.status === "in_progress" ? getRemainingSeconds(updated.endsAt) : 0,
        );
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Live 1-second countdown derived from persistent wall-clock endsAt
  useEffect(() => {
    if (!session || session.status !== "in_progress") return;

    const tick = () => {
      const left = getRemainingSeconds(session.endsAt);
      setRemainingSeconds(left);
      if (left <= 0) {
        finalizeSession(session, "timeout");
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session, finalizeSession]);

  // Close college suggestions dropdown on outside click
  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (collegeBoxRef.current && !collegeBoxRef.current.contains(event.target as Node)) {
        setCollegeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredColleges = useMemo(() => {
    const q = collegeName.trim().toLowerCase();
    if (!q) return applicantColleges.slice(0, 60);
    return applicantColleges.filter((c) => c.toLowerCase().includes(q)).slice(0, 60);
  }, [applicantColleges, collegeName]);

  const handleStartAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    if (!candidateName.trim()) {
      nextErrors.candidateName = "Candidate Name is required";
    }
    if (!/^\d{5}$/.test(safDigits)) {
      nextErrors.safId = "Enter the 5-digit SAF ID number after SAF";
    }
    if (!collegeName.trim()) {
      nextErrors.collegeName = "College / Center Name is required";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please fill in all required candidate details to proceed.");
      return;
    }

    const fullSafId = `SAF${safDigits}`;
    setCheckingSaf(true);
    const { alreadyCompleted } = await checkSafAssessmentCompleted(fullSafId);
    setCheckingSaf(false);

    if (alreadyCompleted) {
      const msg = `Assessment has already been completed for ${fullSafId}. Only one attempt is allowed per SAF ID.`;
      setErrors({ safId: msg });
      toast.error(msg);
      return;
    }

    setErrors({});
    setInstructionsAccepted(false);
    setInstructionsDialogOpen(true);
  };

  const handleConfirmStart = () => {
    if (!instructionsAccepted) return;
    setInstructionsDialogOpen(false);
    const newSession = createAssessmentSession(
      {
        candidateName,
        safId: `SAF${safDigits}`,
        collegeName,
      },
      ASSESSMENT_DURATION_SECONDS,
    );
    persistSession(newSession);
    setRemainingSeconds(ASSESSMENT_DURATION_SECONDS);
    toast.success("Assessment started. Your progress and timer are saved automatically.");
  };

  const totalQuestions = SAMPLE_ASSESSMENT_QUESTIONS.length;
  const safeIndex = session ? Math.min(Math.max(0, session.currentIndex), totalQuestions - 1) : 0;
  const currentQuestion = SAMPLE_ASSESSMENT_QUESTIONS[safeIndex];

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return SAMPLE_ASSESSMENT_QUESTIONS.filter((q) => session.answers[q.id] !== undefined).length;
  }, [session]);

  const scoreSummary = useMemo(() => {
    if (!session) return { correct: 0, attempted: 0 };
    let correct = 0;
    let attempted = 0;
    for (const q of SAMPLE_ASSESSMENT_QUESTIONS) {
      const chosen = session.answers[q.id];
      if (chosen !== undefined) {
        attempted += 1;
        if (chosen === q.correctIndex) {
          correct += 1;
        }
      }
    }
    return { correct, attempted };
  }, [session]);

  const selectOption = (questionId: string, optionIndex: number) => {
    if (!session || session.status !== "in_progress") return;
    persistSession({
      ...session,
      answers: {
        ...session.answers,
        [questionId]: optionIndex,
      },
    });
  };

  const goToQuestion = (index: number) => {
    if (!session || session.status !== "in_progress") return;
    const bounded = Math.min(Math.max(0, index), totalQuestions - 1);
    persistSession({
      ...session,
      currentIndex: bounded,
    });
  };

  const handleBackToAssessmentHome = () => {
    if (session?.syncStatus === "pending") {
      toast.info("Please wait while your results finish saving.");
      return;
    }
    if (session?.candidate.safId) {
      recordCompletedSafId(session.candidate.safId);
    }
    clearAssessmentSession();
    setSession(null);
    setRemainingSeconds(ASSESSMENT_DURATION_SECONDS);
    setCandidateName("");
    setSafDigits("");
    setCollegeName("");
    setErrors({});
    setInstructionsAccepted(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isLowTime = remainingSeconds <= 5 * 60;

  return (
    <div className="kk-page flex min-h-screen flex-col bg-slate-50/60">
      <SiteHeader />

      <section className="kk-banner">
        <div className="kk-wrap">
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <h1 className="text-2xl font-extrabold tracking-wide text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.7)] sm:text-3xl lg:text-4xl">
              Computer Programming Assessment
            </h1>
            <p className="mt-1.5 text-xs font-medium text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] sm:text-sm">
              25 Questions • 50 Marks • 1 Hour Duration • Auto-Saved Session
            </p>
          </div>
        </div>
      </section>

      <main className="kk-wrap flex-1">
        <div className="py-8 sm:py-10">
          {!mounted ? (
            <div className="mx-auto max-w-2xl rounded-lg border border-border bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Loading assessment session…</p>
            </div>
          ) : !session ? (
            /* ================= STEP 1: CANDIDATE ENTRY FORM ================= */
            <div className="mx-auto max-w-3xl">
              <form onSubmit={handleStartAssessment} noValidate>
                <Section title="Computer Programming Assessment — Candidate Login" variant="main">
                  <p className="mb-4 text-sm text-slate-600">
                    Enter your details accurately before starting the assessment. Once started, your
                    1-hour timer and answers are saved automatically even if you refresh or close
                    and reopen this page.
                  </p>

                  <Row>
                    <TextField
                      label="Candidate Name"
                      required
                      span={12}
                      value={candidateName}
                      onChange={(v) => {
                        setCandidateName(v);
                        if (errors.candidateName) {
                          setErrors((prev) => ({ ...prev, candidateName: undefined }));
                        }
                      }}
                      placeholder="Enter candidate full name"
                      error={errors.candidateName}
                    />

                    <Field
                      label="SAF ID"
                      required
                      span={12}
                      error={errors.safId}
                      htmlFor="assessment-saf-digits"
                    >
                      <div
                        className={`flex h-[var(--kk-field-h)] items-center overflow-hidden rounded border bg-white focus-within:border-[var(--kk-blue)] focus-within:ring-2 focus-within:ring-[var(--kk-blue)]/15 ${
                          errors.safId ? "border-[var(--kk-red)]" : "border-[var(--kk-line)]"
                        }`}
                      >
                        <span className="flex h-full items-center border-r border-[var(--kk-line)] bg-slate-100 px-3 font-mono text-sm font-bold text-[#123A6B] select-none">
                          SAF
                        </span>
                        <input
                          id="assessment-saf-digits"
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          className="h-full w-full bg-transparent px-3 font-mono text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
                          value={safDigits}
                          placeholder="Enter 5 digits (e.g., 12345)"
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 5);
                            setSafDigits(digits);
                            if (errors.safId) {
                              setErrors((prev) => ({ ...prev, safId: undefined }));
                            }
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Full SAF ID:{" "}
                        <strong className="font-mono text-slate-800">
                          SAF{safDigits || "XXXXX"}
                        </strong>{" "}
                        (enter 5 digits only)
                      </p>
                    </Field>

                    <Field
                      label="College / Center Name"
                      required
                      span={12}
                      error={errors.collegeName}
                      htmlFor="assessment-college-input"
                    >
                      <div className="relative" ref={collegeBoxRef}>
                        <input
                          id="assessment-college-input"
                          type="text"
                          className={`form-ctrl${errors.collegeName ? " is-invalid" : ""}`}
                          value={collegeName}
                          placeholder="Search or enter College / Center Name"
                          autoComplete="off"
                          onFocus={() => setCollegeMenuOpen(true)}
                          onChange={(e) => {
                            setCollegeName(e.target.value);
                            setCollegeMenuOpen(true);
                            if (errors.collegeName) {
                              setErrors((prev) => ({ ...prev, collegeName: undefined }));
                            }
                          }}
                        />
                        {collegeMenuOpen && filteredColleges.length > 0 ? (
                          <ul className="absolute left-0 right-0 top-[calc(100%+2px)] z-40 max-h-56 overflow-auto rounded border border-border bg-white py-1 shadow-lg">
                            {filteredColleges.map((college) => (
                              <li key={college}>
                                <button
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setCollegeName(college);
                                    setCollegeMenuOpen(false);
                                    if (errors.collegeName) {
                                      setErrors((prev) => ({ ...prev, collegeName: undefined }));
                                    }
                                  }}
                                >
                                  {college}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </Field>
                  </Row>

                  <div className="kk-actions pb-4">
                    <button
                      type="submit"
                      disabled={checkingSaf}
                      className="btn-kk btn-primary-kk inline-flex items-center gap-2 px-6 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span>{checkingSaf ? "Verifying SAF ID…" : "Start Assessment"}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </Section>
              </form>
            </div>
          ) : session.status === "in_progress" && currentQuestion ? (
            /* ================= STEP 2: ACTIVE ASSESSMENT ================= */
            <div className="space-y-4 lg:space-y-6">
              {/* Sticky Candidate + Timer Bar */}
              <div className="sticky top-[71px] md:top-[87px] z-20 rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-700">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#123A6B]">
                      <User className="h-4 w-4 text-[#EE5D1D]" />
                      {session.candidate.candidateName}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <IdCard className="h-4 w-4 text-slate-500" />
                      <strong>SAF ID:</strong> {session.candidate.safId}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-slate-500" />
                      <strong>Center:</strong> {session.candidate.collegeName}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <div className="rounded-md bg-slate-100 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                      Answered: {answeredCount} / {totalQuestions}
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-1.5 text-sm sm:text-base font-bold tabular-nums ${
                        isLowTime
                          ? "border-red-300 bg-red-50 text-red-700 animate-pulse"
                          : "border-blue-200 bg-blue-50 text-[#123A6B]"
                      }`}
                      aria-live="polite"
                    >
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(remainingSeconds)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-12">
                {/* Main Question Card */}
                <div className="order-2 lg:order-1 lg:col-span-8">
                  <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded bg-[#123A6B] px-2.5 py-1 text-xs font-bold text-white">
                          Question {currentQuestion.number} of {totalQuestions}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {currentQuestion.section}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <h2 className="text-base sm:text-lg font-semibold leading-relaxed text-slate-900">
                        {currentQuestion.question}
                      </h2>

                      <div className="mt-5 space-y-3">
                        {currentQuestion.options.map((optionText, optionIndex) => {
                          const selected = session.answers[currentQuestion.id] === optionIndex;
                          const label = OPTION_LABELS[optionIndex] ?? String(optionIndex + 1);
                          return (
                            <button
                              key={optionIndex}
                              type="button"
                              onClick={() => selectOption(currentQuestion.id, optionIndex)}
                              className={`flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-all cursor-pointer ${
                                selected
                                  ? "border-[#123A6B] bg-blue-50/70 ring-1 ring-[#123A6B]"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                                  selected
                                    ? "border-[#123A6B] bg-[#123A6B] text-white"
                                    : "border-slate-300 bg-slate-50 text-slate-700"
                                }`}
                              >
                                {label}
                              </span>
                              <span className="pt-0.5 text-sm sm:text-[15px] text-slate-800">
                                {optionText}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 flex flex-nowrap items-center justify-between gap-2 sm:gap-3 border-t border-slate-200 pt-4">
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            disabled={safeIndex === 0}
                            onClick={() => goToQuestion(safeIndex - 1)}
                            className="btn-kk btn-cancel-kk inline-flex items-center gap-1 whitespace-nowrap !px-3 sm:!px-5 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-4 w-4 shrink-0" />
                            Previous
                          </button>
                        </div>

                        <div className="flex shrink-0 items-center">
                          {safeIndex < totalQuestions - 1 ? (
                            <button
                              type="button"
                              onClick={() => goToQuestion(safeIndex + 1)}
                              className="btn-kk btn-primary-kk inline-flex items-center gap-1 whitespace-nowrap !px-3 sm:!px-5 text-xs sm:text-sm font-semibold"
                            >
                              Next
                              <ChevronRight className="h-4 w-4 shrink-0" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSubmitDialogOpen(true)}
                              className="btn-kk inline-flex items-center gap-1.5 whitespace-nowrap !px-3 sm:!px-5 text-xs sm:text-sm bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                            >
                              <Send className="h-4 w-4 shrink-0" />
                              Submit Assessment
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Palette Sidebar (top on mobile below details card, sidebar on desktop) */}
                <aside className="order-1 lg:order-2 lg:col-span-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 lg:p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#123A6B]">
                        Question Navigator
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSubmitDialogOpen(true)}
                        className="inline-flex lg:hidden items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                        Submit
                      </button>
                    </div>

                    <div className="mt-2.5 lg:mt-4 grid grid-cols-9 sm:grid-cols-10 lg:grid-cols-5 gap-1.5 lg:gap-2">
                      {SAMPLE_ASSESSMENT_QUESTIONS.map((q, idx) => {
                        const isCurrent = idx === safeIndex;
                        const isAnswered = session.answers[q.id] !== undefined;

                        const tileClasses = isAnswered
                          ? "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100";

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => goToQuestion(idx)}
                            className={`h-7 lg:h-10 rounded lg:rounded-md border text-[11px] lg:text-xs font-bold transition-all cursor-pointer ${tileClasses} ${
                              isCurrent ? "ring-2 ring-[#123A6B] ring-offset-1" : ""
                            }`}
                          >
                            {q.number}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 lg:mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 lg:grid lg:grid-cols-2 lg:gap-2 border-t border-slate-100 pt-2 lg:pt-3 text-[11px] lg:text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <span className="h-3 w-3 lg:h-3.5 lg:w-3.5 rounded border border-emerald-500 bg-emerald-600" />
                        <span>Answered ({answeredCount})</span>
                      </div>
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <span className="h-3 w-3 lg:h-3.5 lg:w-3.5 rounded border border-slate-300 bg-white" />
                        <span>Unanswered ({totalQuestions - answeredCount})</span>
                      </div>
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <span className="h-3 w-3 lg:h-3.5 lg:w-3.5 rounded border border-slate-300 ring-2 ring-[#123A6B]" />
                        <span>Current</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSubmitDialogOpen(true)}
                      className="mt-5 hidden lg:flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 cursor-pointer"
                    >
                      <FileCheck2 className="h-4 w-4" />
                      Submit Assessment
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          ) : (
            /* ================= STEP 3: SUBMITTED SUMMARY ================= */
            <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-[#123A6B]">Assessment Submitted</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {session.submissionReason === "timeout"
                    ? "The 1-hour assessment timer ended and your Computer Programming Assessment responses were submitted automatically."
                    : "Thank you. Your Computer Programming Assessment responses have been recorded."}
                </p>
              </div>

              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500">Candidate Name</dt>
                    <dd className="font-semibold text-slate-900">
                      {session.candidate.candidateName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500">SAF ID</dt>
                    <dd className="font-semibold text-slate-900">{session.candidate.safId}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase text-slate-500">
                      College / Center Name
                    </dt>
                    <dd className="font-semibold text-slate-900">
                      {session.candidate.collegeName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500">
                      Questions Attempted
                    </dt>
                    <dd className="font-semibold text-slate-900">
                      {scoreSummary.attempted} / {totalQuestions}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500">Score</dt>
                    <dd className="font-semibold text-emerald-700">
                      {scoreSummary.correct * MARKS_PER_QUESTION} /{" "}
                      {totalQuestions * MARKS_PER_QUESTION} marks ({scoreSummary.correct} /{" "}
                      {totalQuestions})
                    </dd>
                  </div>
                  {session.submittedAt ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase text-slate-500">Submitted At</dt>
                      <dd className="font-medium text-slate-800">
                        {new Date(session.submittedAt).toLocaleString()}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm">
                {session.syncStatus === "synced" ? (
                  <span className="font-medium text-emerald-700">Results are saved.</span>
                ) : session.syncStatus === "failed" ? (
                  <>
                    <span className="text-red-700">
                      Could not save result to server
                      {session.syncError ? `: ${session.syncError}` : "."}
                    </span>
                    <button
                      type="button"
                      onClick={() => void syncResultToDatabase(session)}
                      className="btn-kk btn-primary-kk h-8 px-3 text-xs font-semibold"
                    >
                      Retry Save
                    </button>
                  </>
                ) : (
                  <span className="text-slate-600">Saving result to database…</span>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleBackToAssessmentHome}
                  disabled={session.syncStatus === "pending"}
                  className="btn-kk btn-primary-kk inline-flex items-center gap-2 px-6 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Home className="h-4 w-4" />
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />

      {/* Instructions Confirmation Modal before starting */}
      <AlertDialog
        open={instructionsDialogOpen}
        onOpenChange={(open) => {
          setInstructionsDialogOpen(open);
          if (!open) setInstructionsAccepted(false);
        }}
      >
        <AlertDialogContent className="w-[90%] max-w-[90%] sm:max-w-lg rounded-xl p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#123A6B]">
              Computer Programming Assessment — Instructions
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left text-sm text-slate-700">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm">
                  <p>
                    <strong>Candidate:</strong> {candidateName.trim()}
                  </p>
                  <p>
                    <strong>SAF ID:</strong>{" "}
                    <span className="font-mono font-semibold">SAF{safDigits}</span>
                  </p>
                  <p>
                    <strong>College / Center:</strong> {collegeName.trim()}
                  </p>
                </div>

                <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                  <li>
                    Answer all <strong>{totalQuestions} questions</strong>. Each question carries{" "}
                    <strong>{MARKS_PER_QUESTION} marks</strong> (Total:{" "}
                    <strong>{totalQuestions * MARKS_PER_QUESTION} marks</strong>).
                  </li>
                  <li>
                    Choose only one correct option for each question. There is{" "}
                    <strong>no negative marking</strong>.
                  </li>
                  <li>
                    Default Duration: <strong>60 Minutes (1 Hour)</strong> countdown timer starts
                    once you begin.
                  </li>
                  <li>
                    Persistent Session: Refreshing or closing and reopening <code>/assessment</code>{" "}
                    will resume your test without ending it.
                  </li>
                  <li>
                    The assessment submits automatically when the 1-hour timer reaches zero, or when
                    you click <strong>Submit Assessment</strong>.
                  </li>
                </ul>

                <label
                  htmlFor="instructions-agree-checkbox"
                  className="flex cursor-pointer items-start gap-2.5 rounded-md border border-blue-200 bg-blue-50/70 p-3 text-xs sm:text-sm font-medium text-slate-800"
                >
                  <input
                    id="instructions-agree-checkbox"
                    type="checkbox"
                    checked={instructionsAccepted}
                    onChange={(e) => setInstructionsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#123A6B] cursor-pointer"
                  />
                  <span>
                    I have read and understood all the instructions and am ready to start the
                    assessment.
                  </span>
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <button
              type="button"
              disabled={!instructionsAccepted}
              onClick={handleConfirmStart}
              className="btn-kk btn-primary-kk inline-flex items-center justify-center gap-1.5 px-5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Start Assessment</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Modal */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent className="w-[90%] max-w-[90%] sm:max-w-lg rounded-xl p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered <strong>{answeredCount}</strong> out of{" "}
              <strong>{totalQuestions}</strong> questions. Once submitted, you will not be able to
              change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setSubmitDialogOpen(false);
                if (session) {
                  finalizeSession(session, "manual");
                }
              }}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirm &amp; Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
