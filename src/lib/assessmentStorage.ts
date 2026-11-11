import { ASSESSMENT_DURATION_SECONDS } from "@/lib/assessmentQuestions";

export const ASSESSMENT_STORAGE_KEY = "ksaw_assessment_session_v1";
const COMPLETED_SAF_STORAGE_KEY = "ksaw_completed_saf_ids_v1";

export interface AssessmentCandidate {
  candidateName: string;
  safId: string;
  collegeName: string;
}

export type AssessmentSyncStatus = "pending" | "synced" | "failed";

export interface AssessmentSession {
  version: 1;
  status: "in_progress" | "submitted";
  candidate: AssessmentCandidate;
  startedAt: number;
  durationSeconds: number;
  endsAt: number;
  currentIndex: number;
  answers: Record<string, number>;
  markedForReview: string[];
  submittedAt?: number | undefined;
  submissionReason?: "manual" | "timeout" | undefined;
  syncStatus?: AssessmentSyncStatus | undefined;
  syncError?: string | undefined;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function createAssessmentSession(
  candidate: AssessmentCandidate,
  durationSeconds: number = ASSESSMENT_DURATION_SECONDS,
): AssessmentSession {
  const now = Date.now();
  return {
    version: 1,
    status: "in_progress",
    candidate: {
      candidateName: candidate.candidateName.trim(),
      safId: candidate.safId.trim(),
      collegeName: candidate.collegeName.trim(),
    },
    startedAt: now,
    durationSeconds,
    endsAt: now + durationSeconds * 1000,
    currentIndex: 0,
    answers: {},
    markedForReview: [],
  };
}

export function loadAssessmentSession(): AssessmentSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(ASSESSMENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AssessmentSession> | null;
    if (
      !parsed ||
      parsed.version !== 1 ||
      (parsed.status !== "in_progress" && parsed.status !== "submitted") ||
      !parsed.candidate ||
      typeof parsed.candidate.candidateName !== "string" ||
      typeof parsed.candidate.safId !== "string" ||
      typeof parsed.candidate.collegeName !== "string" ||
      typeof parsed.startedAt !== "number" ||
      typeof parsed.endsAt !== "number"
    ) {
      return null;
    }

    return {
      version: 1,
      status: parsed.status,
      candidate: parsed.candidate,
      startedAt: parsed.startedAt,
      durationSeconds:
        typeof parsed.durationSeconds === "number" && parsed.durationSeconds > 0
          ? parsed.durationSeconds
          : ASSESSMENT_DURATION_SECONDS,
      endsAt: parsed.endsAt,
      currentIndex:
        typeof parsed.currentIndex === "number" && parsed.currentIndex >= 0
          ? parsed.currentIndex
          : 0,
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      markedForReview: Array.isArray(parsed.markedForReview) ? parsed.markedForReview : [],
      submittedAt: typeof parsed.submittedAt === "number" ? parsed.submittedAt : undefined,
      submissionReason:
        parsed.submissionReason === "manual" || parsed.submissionReason === "timeout"
          ? parsed.submissionReason
          : undefined,
      syncStatus:
        parsed.syncStatus === "pending" ||
        parsed.syncStatus === "synced" ||
        parsed.syncStatus === "failed"
          ? parsed.syncStatus
          : undefined,
      syncError: typeof parsed.syncError === "string" ? parsed.syncError : undefined,
    };
  } catch {
    return null;
  }
}

export function saveAssessmentSession(session: AssessmentSession): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage quota or private-browsing errors
  }
}

export function clearAssessmentSession(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getRemainingSeconds(endsAt: number, now: number = Date.now()): number {
  const diffMs = endsAt - now;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / 1000);
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

export function recordCompletedSafId(safId: string): void {
  if (!isBrowser()) return;
  const normalized = safId.trim().toUpperCase();
  if (!normalized) return;
  try {
    const raw = window.localStorage.getItem(COMPLETED_SAF_STORAGE_KEY);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!Array.isArray(list)) {
      window.localStorage.setItem(COMPLETED_SAF_STORAGE_KEY, JSON.stringify([normalized]));
      return;
    }
    if (!list.includes(normalized)) {
      window.localStorage.setItem(COMPLETED_SAF_STORAGE_KEY, JSON.stringify([...list, normalized]));
    }
  } catch {
    // Ignore storage errors
  }
}

export function hasLocalCompletedSafId(safId: string): boolean {
  if (!isBrowser()) return false;
  const normalized = safId.trim().toUpperCase();
  if (!normalized) return false;
  try {
    const raw = window.localStorage.getItem(COMPLETED_SAF_STORAGE_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) && list.includes(normalized);
  } catch {
    return false;
  }
}
