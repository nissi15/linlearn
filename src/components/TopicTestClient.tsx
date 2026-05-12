"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TerminalPanel from "@/components/TerminalPanel";
import ConfidenceBadge from "@/components/ConfidenceBadge";

type Phase = "INTRO" | "TESTING" | "SCORING" | "RESULTS";

interface Question {
  question: string;
  setupCommands: string[];
  successCriteria: Array<{
    check_command: string;
    expected_output: string;
    description: string;
  }>;
}

interface ScoreResult {
  confidence: number;
  passed: boolean;
  overallFeedback: string;
  perQuestion: Array<{ passed: boolean; feedback: string }>;
  weakLessons: string[];
}

interface Props {
  topicId: string;
  topicName: string;
  lessonTitles: string[];
  existingTestId: string | null;
}

export default function TopicTestClient({
  topicId,
  topicName,
  lessonTitles,
  existingTestId,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(
    existingTestId ? "TESTING" : "INTRO"
  );
  const [testId, setTestId] = useState<string | null>(existingTestId);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [checkedQuestions, setCheckedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTest = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/topic-test/${topicId}/start`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start test");
      }

      const data = await res.json();
      setTestId(data.testId);
      setQuestions(data.questions);
      setPhase("TESTING");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start test");
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  const handleToggleQuestion = useCallback((index: number) => {
    setCheckedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleSubmitTest = useCallback(async () => {
    if (!testId) return;

    setPhase("SCORING");
    setError(null);

    try {
      const res = await fetch(`/api/topic-test/score/${testId}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to score test");
      }

      const data: ScoreResult = await res.json();
      setScoreResult(data);
      setPhase("RESULTS");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to score test");
      setPhase("TESTING");
    }
  }, [testId]);

  // ── INTRO ────────────────────────────────────────────────────
  if (phase === "INTRO") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-8 max-w-lg w-full space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--accent)] mb-1">
              Topic Test
            </h1>
            <p className="text-lg text-[var(--foreground)]">{topicName}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-3">
              Lessons covered
            </h3>
            <ul className="space-y-2">
              {lessonTitles.map((title, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-[var(--success)] flex items-center justify-center shrink-0">
                    <span className="text-[var(--background)] text-[10px] font-bold">
                      &#10003;
                    </span>
                  </div>
                  <span className="text-[var(--foreground)]">{title}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-[var(--foreground)]/60">
            You will receive 3 practical questions covering all the lessons
            above. Complete each task in the terminal to demonstrate your
            understanding.
          </p>

          {error && (
            <p className="text-sm text-[var(--error)]">{error}</p>
          )}

          <button
            type="button"
            onClick={handleStartTest}
            disabled={loading}
            className="w-full bg-[var(--accent)] text-[var(--background)] font-semibold px-6 py-3 rounded-lg text-sm hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating questions..." : "Start Test"}
          </button>
        </div>
      </div>
    );
  }

  // ── TESTING ──────────────────────────────────────────────────
  if (phase === "TESTING") {
    return (
      <div className="h-screen flex">
        {/* Left: Questions */}
        <div className="w-[45%] h-full flex flex-col border-r border-[var(--border)]">
          <div className="border-b border-[var(--border)] bg-[var(--panel)] px-6 py-4">
            <h2 className="text-lg font-bold text-[var(--accent)]">
              {topicName} &mdash; Test
            </h2>
            <p className="text-xs text-[var(--foreground)]/50 mt-1">
              Complete all tasks in the terminal. Check off each question as you
              finish it.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {questions.map((q, i) => (
              <div
                key={i}
                className={`bg-[var(--panel)] border rounded-xl p-5 transition-colors ${
                  checkedQuestions.has(i)
                    ? "border-[var(--success)]/50"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleQuestion(i)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checkedQuestions.has(i)
                        ? "bg-[var(--success)] border-[var(--success)]"
                        : "border-[var(--border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {checkedQuestions.has(i) && (
                      <span className="text-[var(--background)] text-xs font-bold">
                        &#10003;
                      </span>
                    )}
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                      Question {i + 1}
                    </h3>
                    <p className="text-sm text-[var(--foreground)]/80 whitespace-pre-wrap leading-relaxed">
                      {q.question}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--panel)] p-4">
            {error && (
              <p className="text-sm text-[var(--error)] mb-3">{error}</p>
            )}
            <button
              type="button"
              onClick={handleSubmitTest}
              className="w-full bg-[var(--accent)] text-[var(--background)] font-semibold px-6 py-3 rounded-lg text-sm hover:bg-[var(--accent-dim)] transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Right: Terminal */}
        <div className="w-[55%] h-full min-w-0">
          {testId && <TerminalPanel progressId={testId} visible />}
        </div>
      </div>
    );
  }

  // ── SCORING ──────────────────────────────────────────────────
  if (phase === "SCORING") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            Scoring your test...
          </h2>
          <p className="text-sm text-[var(--foreground)]/60">
            Inspecting your sandbox and evaluating your solutions. This may take
            a moment.
          </p>
          {error && (
            <p className="text-sm text-[var(--error)]">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────
  if (phase === "RESULTS" && scoreResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-8 max-w-2xl w-full space-y-8">
          {/* Header with confidence badge */}
          <div className="flex items-center gap-6">
            <ConfidenceBadge score={scoreResult.confidence} size="lg" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {scoreResult.passed ? "Test Passed" : "Test Not Passed"}
              </h1>
              <p className="text-sm text-[var(--foreground)]/60 mt-1">
                {topicName}
              </p>
            </div>
          </div>

          {/* Overall feedback */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-2">
              Overall Feedback
            </h3>
            <p className="text-sm text-[var(--foreground)]/80 leading-relaxed">
              {scoreResult.overallFeedback}
            </p>
          </div>

          {/* Per-question results */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-3">
              Question Results
            </h3>
            <div className="space-y-3">
              {scoreResult.perQuestion.map((pq, i) => (
                <div
                  key={i}
                  className={`border rounded-lg p-4 ${
                    pq.passed
                      ? "border-[var(--success)]/30 bg-[var(--success)]/5"
                      : "border-[var(--error)]/30 bg-[var(--error)]/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        pq.passed
                          ? "bg-[var(--success)]"
                          : "bg-[var(--error)]"
                      }`}
                    >
                      <span className="text-[var(--background)] text-[10px] font-bold">
                        {pq.passed ? "✓" : "✗"}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      Question {i + 1}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--foreground)]/70 ml-6">
                    {pq.feedback}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Weak lessons */}
          {scoreResult.weakLessons.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--foreground)]/50 uppercase tracking-wider mb-3">
                Lessons to Review
              </h3>
              <ul className="space-y-2">
                {scoreResult.weakLessons.map((lesson, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-[var(--warning)]"
                  >
                    <div className="w-4 h-4 rounded-full bg-[var(--warning)] flex items-center justify-center shrink-0">
                      <span className="text-[var(--background)] text-[10px] font-bold">
                        !
                      </span>
                    </div>
                    {lesson}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full bg-[var(--accent)] text-[var(--background)] font-semibold px-6 py-3 rounded-lg text-sm hover:bg-[var(--accent-dim)] transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
