import type { Database } from "@/integrations/supabase/types";
import { MARKS_PER_QUESTION, SAMPLE_ASSESSMENT_QUESTIONS } from "@/lib/assessmentQuestions";
import { formatDuration } from "@/lib/assessmentStorage";

type AssessmentRow = Database["public"]["Tables"]["amrutha_munnade_assessment"]["Row"];

interface AnswerDetail {
  questionNumber?: number;
  section?: string;
  selectedIndex?: number;
  selectedOption?: string | null;
  isCorrect?: boolean;
}

const OPTION_LETTERS = ["a", "b", "c", "d"] as const;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseAnswersMap(raw: AssessmentRow["answers"]): Record<string, AnswerDetail> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, AnswerDetail>;
}

function renderQuestionHtml(
  questionNumber: number,
  questionText: string,
  options: readonly [string, string, string, string],
  correctIndex: number,
  detail: AnswerDetail | undefined,
): string {
  const selectedIndex =
    typeof detail?.selectedIndex === "number" && detail.selectedIndex >= 0
      ? detail.selectedIndex
      : -1;
  const isUnanswered = selectedIndex < 0;
  const isQuestionCorrect = !isUnanswered && selectedIndex === correctIndex;

  const statusText = isUnanswered
    ? "Not Answered (0)"
    : isQuestionCorrect
      ? `Correct (+${MARKS_PER_QUESTION})`
      : "Wrong (0)";
  const statusClass = isUnanswered
    ? "status-unanswered"
    : isQuestionCorrect
      ? "status-correct"
      : "status-wrong";

  const optionsHtml = options
    .map((optionText, idx) => {
      const letter = OPTION_LETTERS[idx] ?? String(idx + 1);
      const isSelected = selectedIndex === idx;
      const isCorrect = idx === correctIndex;

      let badgeHtml = "";
      let itemClass = "option-item";

      if (isSelected && isCorrect) {
        itemClass += " option-selected-correct";
        badgeHtml = `<span class="option-badge badge-correct">Selected &bull; Correct</span>`;
      } else if (isSelected && !isCorrect) {
        itemClass += " option-selected-wrong";
        badgeHtml = `<span class="option-badge badge-wrong">Selected &bull; Wrong</span>`;
      } else if (isCorrect) {
        itemClass += " option-correct-key";
        badgeHtml = `<span class="option-badge badge-key">Correct Answer</span>`;
      }

      return `<li class="${itemClass}"><span class="option-text">${letter}) ${escapeHtml(optionText)}</span>${badgeHtml}</li>`;
    })
    .join("");

  return `
    <section class="question-block">
      <div class="question-header">
        <div class="question-title">${questionNumber}. ${escapeHtml(questionText)}</div>
        <span class="question-status ${statusClass}">${statusText}</span>
      </div>
      <ul class="options-list">
        ${optionsHtml}
      </ul>
    </section>
  `;
}

function buildPrintableQuestionPaperHtml(row: AssessmentRow): string {
  const answersMap = parseAnswersMap(row.answers);
  const totalMarks = row.total_questions * MARKS_PER_QUESTION;
  const marksObtained = row.correct_count * MARKS_PER_QUESTION;
  const scorePercent = `${Number(row.score_percentage).toFixed(1)}%`;
  const timeTaken = formatDuration(row.time_taken_seconds);

  const questionsHtml = SAMPLE_ASSESSMENT_QUESTIONS.map((question) => {
    const detail = answersMap[question.id];
    return renderQuestionHtml(
      question.number,
      question.question,
      question.options,
      question.correctIndex,
      detail,
    );
  }).join("");

  const safeTitle = `${escapeHtml(row.saf_id)} - Computer Programming Question Paper`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${safeTitle}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 11mm 14mm 14mm 14mm;

        @top-left {
          content: "";
        }

        @top-center {
          content: "";
        }

        @top-right {
          content: "";
        }

        @bottom-left {
          content: "";
        }

        @bottom-center {
          content: "";
        }

        @bottom-right {
          content: "Page " counter(page) " of " counter(pages);
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 8.5pt;
          font-weight: 500;
          color: #64748b;
          vertical-align: top;
          padding-top: 2mm;
        }
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #1e293b;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 10pt;
        line-height: 1.38;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .paper-container {
        width: 100%;
        max-width: 182mm;
        margin: 0 auto;
      }

      .paper-header {
        margin-bottom: 8pt;
      }

      .paper-scheme {
        font-size: 8.5pt;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0 0 1.5pt 0;
      }

      .paper-title {
        font-size: 14pt;
        font-weight: 700;
        color: #123a6b;
        margin: 0;
        letter-spacing: -0.01em;
      }

      .candidate-box {
        border: 1pt solid #94a3b8;
        border-radius: 5pt;
        overflow: hidden;
        margin-bottom: 10pt;
      }

      .candidate-box-title {
        background: #123a6b;
        color: #ffffff;
        font-size: 8.5pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 4pt 9pt;
      }

      .details-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
      }

      .details-table th,
      .details-table td {
        border-top: 0.75pt solid #cbd5e1;
        border-right: 0.75pt solid #cbd5e1;
        padding: 3.5pt 7pt;
        text-align: left;
        vertical-align: top;
      }

      .details-table th:last-child,
      .details-table td:last-child {
        border-right: none;
      }

      .details-table th {
        width: 18%;
        background: #f8fafc;
        color: #475569;
        font-weight: 600;
      }

      .details-table td {
        color: #0f172a;
        font-weight: 500;
      }

      .score-value {
        font-weight: 700;
        color: #123a6b;
      }

      .question-block {
        break-inside: avoid;
        page-break-inside: avoid;
        border: 0.75pt solid #e2e8f0;
        border-radius: 4pt;
        padding: 6pt 9pt;
        margin-bottom: 6.5pt;
      }

      .question-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8pt;
        margin-bottom: 3.5pt;
      }

      .question-title {
        font-size: 10pt;
        font-weight: 600;
        color: #0f172a;
        flex: 1;
        min-width: 0;
      }

      .question-status {
        flex-shrink: 0;
        font-size: 8pt;
        font-weight: 700;
        padding: 1pt 5.5pt;
        border-radius: 3pt;
        white-space: nowrap;
      }

      .status-correct {
        background: #dcfce7;
        color: #166534;
        border: 0.6pt solid #86efac;
      }

      .status-wrong {
        background: #fee2e2;
        color: #991b1b;
        border: 0.6pt solid #fca5a5;
      }

      .status-unanswered {
        background: #f1f5f9;
        color: #475569;
        border: 0.6pt solid #cbd5e1;
      }

      .options-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .option-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8pt;
        padding: 2.2pt 6pt;
        margin-top: 2pt;
        border-radius: 3pt;
        border: 0.6pt solid transparent;
        font-size: 9.2pt;
        line-height: 1.3;
        color: #334155;
      }

      .option-text {
        flex: 1;
        min-width: 0;
      }

      .option-selected-correct {
        background: #f0fdf4;
        border-color: #86efac;
        color: #14532d;
        font-weight: 600;
      }

      .option-selected-wrong {
        background: #fef2f2;
        border-color: #fca5a5;
        color: #991b1b;
        font-weight: 600;
      }

      .option-correct-key {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #166534;
        font-weight: 600;
      }

      .option-badge {
        flex-shrink: 0;
        font-size: 8pt;
        font-weight: 700;
        padding: 1pt 5pt;
        border-radius: 2.5pt;
        white-space: nowrap;
      }

      .badge-correct {
        background: #16a34a;
        color: #ffffff;
      }

      .badge-wrong {
        background: #dc2626;
        color: #ffffff;
      }

      .badge-key {
        background: #dcfce7;
        color: #166534;
        border: 0.6pt solid #86efac;
      }
    </style>
  </head>
  <body>
    <main class="paper-container">
      <header class="paper-header">
        <p class="paper-scheme">Swatantrya Amrutha Mahotsava Munnade</p>
        <h1 class="paper-title">Computer Programming &ndash; Question Paper</h1>
      </header>

      <section class="candidate-box" aria-label="Candidate Details">
        <div class="candidate-box-title">Candidate Details</div>
        <table class="details-table">
          <tbody>
            <tr>
              <th>Candidate Name</th>
              <td>${escapeHtml(row.candidate_name)}</td>
              <th>SAF ID</th>
              <td>${escapeHtml(row.saf_id)}</td>
            </tr>
            <tr>
              <th>Marks Obtained</th>
              <td class="score-value">${marksObtained} / ${totalMarks} (${scorePercent})</td>
              <th>Correct Answers</th>
              <td>${row.correct_count} / ${row.total_questions}</td>
            </tr>
            <tr>
              <th>Attempted</th>
              <td>${row.attempted_count} / ${row.total_questions}</td>
              <th>Time Taken</th>
              <td>${escapeHtml(timeTaken)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      ${questionsHtml}
    </main>
  </body>
</html>`;
}

export function exportAssessmentAnswersPdf(row: AssessmentRow): void {
  const html = buildPrintableQuestionPaperHtml(row);
  const previousTitle = document.title;
  const safeFileSlug = row.saf_id.replace(/[^a-zA-Z0-9_-]/g, "_");
  document.title = `${safeFileSlug}_Computer_Programming_Question_Paper`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  let cleanedUp = false;
  let fallbackTimer: number | undefined;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    document.title = previousTitle;
    if (fallbackTimer !== undefined) {
      window.clearTimeout(fallbackTimer);
    }
    iframe.remove();
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }

    frameWindow.addEventListener("afterprint", cleanup, { once: true });
    window.addEventListener("afterprint", cleanup, { once: true });
    fallbackTimer = window.setTimeout(cleanup, 60_000);

    frameWindow.focus();
    frameWindow.print();
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}
