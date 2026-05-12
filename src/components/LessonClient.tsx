"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import LessonHeader from "@/components/LessonHeader";
import Markdown from "@/components/Markdown";
import ChatPanel from "@/components/ChatPanel";
import TerminalPanel from "@/components/TerminalPanel";
import ConfidenceBadge from "@/components/ConfidenceBadge";

interface Turn {
  id: string;
  role: string;
  content: string;
  step: string;
}

interface LessonData {
  id: string;
  title: string;
  explanation: string;
  example: string;
  taskPrompt: string;
  topicId: string;
}

interface TopicData {
  id: string;
  name: string;
}

interface LessonListItem {
  id: string;
  title: string;
  order: number;
  status: "completed" | "in-progress" | "locked";
  confidence: number;
}

interface AdvanceResult {
  tutorMessage: string;
  newStep: string;
  confidence: number;
  completed: boolean;
  feedback?: string;
}

interface Props {
  progressId: string;
  lesson: LessonData;
  topic: TopicData;
  initialStep: string;
  initialConfidence: number;
  initialCompleted: boolean;
  initialTurns: Turn[];
  lessonsList: LessonListItem[];
  prevLessonId: string | null;
  nextLessonId: string | null;
  retryTaskPrompt?: string | null;
}

export default function LessonClient({
  progressId,
  lesson,
  topic,
  initialStep,
  initialConfidence,
  initialCompleted,
  initialTurns,
  lessonsList,
  prevLessonId,
  nextLessonId,
  retryTaskPrompt,
}: Props) {
  const router = useRouter();

  // Restore the chat transcript from turns persisted in the DB so a reload
  // (or coming back later) resumes where the student left off. The chat is
  // shared across the TASK and FEEDBACK steps so the conversation continues
  // seamlessly after passing.
  const [step, setStep] = useState(initialStep);
  const [confidence, setConfidence] = useState(initialConfidence);
  const [completed, setCompleted] = useState(initialCompleted);
  const [showExplanation, setShowExplanation] = useState(true);
  const [showTask, setShowTask] = useState(true);
  const [chatTurns, setChatTurns] = useState<Turn[]>(() =>
    initialTurns.filter((t) => t.step === "TASK" || t.step === "FEEDBACK")
  );
  const appendTurn = useCallback((turn: Turn) => {
    setChatTurns((prev) => [...prev, turn]);
  }, []);
  const taskContent = retryTaskPrompt || lesson.taskPrompt;

  const handleTaskDone = useCallback((result: AdvanceResult) => {
    setStep(result.newStep);
    setConfidence(result.confidence);
    setCompleted(result.completed);
  }, []);

  const handleNext = async () => {
    if (confidence >= 7) {
      const res = await fetch(`/api/topic/${topic.id}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.allComplete) {
        router.push(`/topic-test/${topic.id}`);
      } else {
        router.push(`/lesson/${data.progressId}`);
      }
    } else {
      router.refresh();
    }
  };

  const isTask = step === "TASK";
  const isFeedback = step === "FEEDBACK";
  const isChatStep = isTask || isFeedback;
  const passed = confidence >= 7;
  const nextLabel = passed
    ? completed
      ? "Take Topic Test"
      : "Next Lesson"
    : "Try Again";

  const referenceColumn = showExplanation ? (
    <div className="w-[26%] min-w-[240px] max-w-[440px] shrink-0 border-r border-[var(--border)] flex flex-col">
      <div className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--panel)] flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
          Reference
        </span>
        <button
          type="button"
          title="Collapse"
          onClick={() => setShowExplanation(false)}
          className="w-6 h-6 flex items-center justify-center rounded text-[var(--foreground)]/50 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer"
        >
          &#8249;
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 text-[var(--foreground)]/90">
        <h3 className="text-base font-bold text-[var(--foreground)] mb-2">
          {lesson.title}
        </h3>
        <Markdown content={lesson.explanation} />
        <h3 className="text-base font-bold text-[var(--foreground)] mt-6 mb-2">
          Example
        </h3>
        <Markdown content={lesson.example} />
      </div>
    </div>
  ) : (
    <button
      type="button"
      title="Show explanation"
      onClick={() => setShowExplanation(true)}
      className="shrink-0 w-7 border-r border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-[var(--foreground)]/40 hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors cursor-pointer"
    >
      &#8250;
    </button>
  );

  return (
    <div className="h-screen flex flex-col">
      <LessonHeader
        topicName={topic.name}
        lessons={lessonsList}
        currentLessonId={lesson.id}
        prevLessonId={prevLessonId}
        nextLessonId={nextLessonId}
        rightSlot={
          isChatStep ? (
            <button
              type="button"
              onClick={() => setShowExplanation((v) => !v)}
              className="text-xs font-medium text-[var(--foreground)]/60 hover:text-[var(--accent)] border border-[var(--border)] rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
            >
              {showExplanation ? "Hide explanation" : "Show explanation"}
            </button>
          ) : null
        }
      />

      <div className="flex-1 min-h-0 flex">
        {isChatStep ? (
          <>
            {/* Column 1 — lesson reference (collapsible) — same in TASK and FEEDBACK */}
            {referenceColumn}

            {/* Column 2 — task prompt + chat (TASK) or post-pass chat (FEEDBACK) */}
            {isTask ? (
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTask((v) => !v)}
                  title={showTask ? "Collapse task" : "Show task"}
                  className="shrink-0 w-full px-4 py-2 border-b border-[var(--border)] bg-[var(--panel)] flex items-center gap-2 text-left hover:bg-[var(--accent)]/5 transition-colors cursor-pointer"
                >
                  <span className="text-[var(--foreground)]/40 text-xs">
                    {showTask ? "▾" : "▸"}
                  </span>
                  <span className="text-sm font-semibold text-[var(--accent)] uppercase tracking-wider">
                    Task
                  </span>
                </button>
                {showTask && (
                  <div className="shrink-0 max-h-[34%] overflow-y-auto border-b border-[var(--border)] bg-[var(--panel)] px-4 pb-4">
                    <p className="text-sm text-[var(--foreground)]/80 whitespace-pre-wrap leading-relaxed">
                      {taskContent}
                    </p>
                  </div>
                )}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ChatPanel
                    progressId={progressId}
                    onDone={handleTaskDone}
                    turns={chatTurns}
                    onAppendTurn={appendTurn}
                  />
                </div>
              </div>
            ) : (
              // FEEDBACK — banner with score + Next button on top, chat fills the rest
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                <div className="shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--panel)] flex items-center gap-3">
                  <ConfidenceBadge score={confidence} />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-bold ${
                        passed
                          ? "text-[var(--success)]"
                          : "text-[var(--warning)]"
                      }`}
                    >
                      {passed ? "Passed" : "Needs work"}
                    </div>
                    <div className="text-xs text-[var(--foreground)]/50">
                      Ask follow-up questions, or move on whenever you're ready.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="shrink-0 bg-[var(--accent)] text-[var(--background)] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-[var(--accent-dim)] transition-colors cursor-pointer"
                  >
                    {nextLabel} &rarr;
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ChatPanel
                    progressId={progressId}
                    onDone={handleTaskDone}
                    turns={chatTurns}
                    onAppendTurn={appendTurn}
                    placeholder="Ask a follow-up question..."
                  />
                </div>
              </div>
            )}

            {/* Column 3 — terminal (only during TASK) */}
            {isTask && (
              <div className="w-[42%] min-w-[300px] shrink-0 border-l border-[var(--border)]">
                <TerminalPanel progressId={progressId} visible={isTask} />
              </div>
            )}
          </>
        ) : (
          // COMPLETED (or any unexpected step) — the lesson normally opens
          // straight into the TASK workspace, so this is just a graceful end state.
          <div className="flex flex-1 min-w-0 flex-col items-center justify-center p-8">
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full text-center space-y-4">
              <div className="text-4xl text-[var(--success)]">&#10003;</div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Lesson complete!
              </h2>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="bg-[var(--accent)] text-[var(--background)] font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[var(--accent-dim)] transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
