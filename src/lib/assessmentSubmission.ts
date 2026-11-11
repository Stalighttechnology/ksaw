import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { SAMPLE_ASSESSMENT_QUESTIONS } from "@/lib/assessmentQuestions";
import {
  hasLocalCompletedSafId,
  recordCompletedSafId,
  type AssessmentSession,
} from "@/lib/assessmentStorage";

export async function checkSafAssessmentCompleted(
  safId: string,
): Promise<{ alreadyCompleted: boolean; error?: string }> {
  const normalized = safId.trim().toUpperCase();
  if (!normalized) return { alreadyCompleted: false };

  if (hasLocalCompletedSafId(normalized)) {
    return { alreadyCompleted: true };
  }

  try {
    const { data, error } = await supabase.rpc("check_saf_assessment_completed", {
      p_saf_id: normalized,
    });

    if (!error) {
      if (data === true) {
        recordCompletedSafId(normalized);
        return { alreadyCompleted: true };
      }
      return { alreadyCompleted: false };
    }

    // Fallback in case the RPC function has not been pushed yet
    const { data: rows, error: selectErr } = await supabase
      .from("amrutha_munnade_assessment")
      .select("id")
      .ilike("saf_id", normalized)
      .limit(1);

    if (!selectErr && Array.isArray(rows) && rows.length > 0) {
      recordCompletedSafId(normalized);
      return { alreadyCompleted: true };
    }

    return {
      alreadyCompleted: false,
      error: error.message,
    };
  } catch (err) {
    return {
      alreadyCompleted: false,
      error: err instanceof Error ? err.message : "Unable to verify SAF ID",
    };
  }
}

export async function submitAssessmentResultToSupabase(
  session: AssessmentSession,
): Promise<{ ok: true; duplicate?: boolean } | { ok: false; error: string }> {
  const totalQuestions = SAMPLE_ASSESSMENT_QUESTIONS.length;
  let attemptedCount = 0;
  let correctCount = 0;

  const detailedAnswers: Record<string, Json> = {};

  for (const q of SAMPLE_ASSESSMENT_QUESTIONS) {
    const selectedIndex = session.answers[q.id];
    if (selectedIndex !== undefined) {
      attemptedCount += 1;
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) {
        correctCount += 1;
      }
      detailedAnswers[q.id] = {
        questionNumber: q.number,
        section: q.section,
        selectedIndex,
        selectedOption: q.options[selectedIndex] ?? null,
        isCorrect,
      };
    }
  }

  const submittedAtMs = session.submittedAt ?? Date.now();
  const timeTakenSeconds = Math.min(
    session.durationSeconds,
    Math.max(0, Math.round((submittedAtMs - session.startedAt) / 1000)),
  );
  const scorePercentage =
    totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(2)) : 0;

  const normalizedSafId = session.candidate.safId.trim().toUpperCase();

  try {
    const { error } = await supabase.from("amrutha_munnade_assessment").insert({
      candidate_name: session.candidate.candidateName,
      saf_id: normalizedSafId,
      college_name: session.candidate.collegeName,
      total_questions: totalQuestions,
      attempted_count: attemptedCount,
      correct_count: correctCount,
      score_percentage: scorePercentage,
      answers: detailedAnswers,
      started_at: new Date(session.startedAt).toISOString(),
      submitted_at: new Date(submittedAtMs).toISOString(),
      duration_seconds: session.durationSeconds,
      time_taken_seconds: timeTakenSeconds,
      submission_reason: session.submissionReason ?? "manual",
    });

    if (error) {
      if (error.code === "23505") {
        recordCompletedSafId(normalizedSafId);
        return { ok: true, duplicate: true };
      }
      return { ok: false, error: error.message };
    }

    recordCompletedSafId(normalizedSafId);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save assessment result",
    };
  }
}
