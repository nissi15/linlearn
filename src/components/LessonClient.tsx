"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LessonHeader from "@/components/LessonHeader";
import Markdown from "@/components/Markdown";
import ChatPanel from "@/components/ChatPanel";
import TerminalPanel from "@/components/TerminalPanel";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import BackgroundMusic from "@/components/BackgroundMusic";

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
  const fxRef = useRef<HTMLDivElement>(null);

  // Restore the chat transcript from turns persisted in the DB so a reload
  // (or coming back later) resumes where the student left off. The chat is
  // shared across the TASK and FEEDBACK steps so the conversation continues
  // seamlessly after passing.
  const [step, setStep] = useState(initialStep);
  const [confidence, setConfidence] = useState(initialConfidence);
  const [completed, setCompleted] = useState(initialCompleted);
  const [showExplanation, setShowExplanation] = useState(true);
  const [showTask, setShowTask] = useState(true);
  const [donePending, setDonePending] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(50);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [chatTurns, setChatTurns] = useState<Turn[]>(() =>
    initialTurns.filter((t) => t.step === "TASK" || t.step === "FEEDBACK")
  );
  const appendTurn = useCallback((turn: Turn) => {
    setChatTurns((prev) => [...prev, turn]);
  }, []);

  const playFXEffect = useCallback(() => {
    if (fxRef.current) {
      fxRef.current.style.animation = "none";
      setTimeout(() => {
        if (fxRef.current) {
          fxRef.current.style.animation = "";
        }
      }, 10);
    }
  }, []);
  const taskContent = retryTaskPrompt || lesson.taskPrompt;
  const sessionMinutes = String(Math.floor(sessionSeconds / 60)).padStart(
    2,
    "0"
  );
  const sessionRemainder = String(sessionSeconds % 60).padStart(2, "0");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSessionSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleTaskDone = useCallback((result: AdvanceResult) => {
    setStep(result.newStep);
    setConfidence(result.confidence);
    setCompleted(result.completed);
  }, []);

  const submitDone = useCallback(async () => {
    if (donePending || step !== "TASK") return;

    const submittedAt = Date.now();
    setDonePending(true);
    playFXEffect();
    appendTurn({
      id: `student-terminal-done-${submittedAt}`,
      role: "student",
      content: "done",
      step: "TASK",
    });

    try {
      const res = await fetch(`/api/lesson/${progressId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "done" }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        appendTurn({
          id: `error-terminal-done-${Date.now()}`,
          role: "tutor",
          content: data?.error ?? "Something went wrong checking your work.",
          step: "TASK",
        });
        return;
      }

      const result = (await res.json()) as AdvanceResult;
      appendTurn({
        id: `tutor-terminal-done-${Date.now()}`,
        role: "tutor",
        content: result.tutorMessage,
        step: result.newStep,
      });
      handleTaskDone(result);
    } catch (err) {
      console.error("done failed:", err);
      appendTurn({
        id: `error-terminal-done-${Date.now()}`,
        role: "tutor",
        content: "Could not reach the server - check your connection and try again.",
        step: "TASK",
      });
    } finally {
      setDonePending(false);
    }
  }, [appendTurn, donePending, handleTaskDone, progressId, step, playFXEffect]);

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
  const tutorState = donePending
    ? "checking"
    : isFeedback
    ? "feedback"
    : isTask
    ? "ready"
    : "complete";
  const passed = confidence >= 7;
  const nextLabel = passed
    ? completed
      ? "Take Topic Test"
      : "Next Lesson"
    : "Try Again";

  const referenceColumn = showExplanation ? (
    <div className="obsidian-panel w-[26%] min-w-[240px] max-w-[440px] shrink-0 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <span className="obsidian-label">
          Reference
        </span>
        <button
          type="button"
          title="Collapse"
          onClick={() => setShowExplanation(false)}
          className="w-7 h-7 flex items-center justify-center border border-transparent text-[var(--foreground)]/50 hover:text-[var(--accent)] hover:border-[var(--border)] hover:bg-white/6 transition-colors cursor-pointer"
        >
          &#8249;
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 text-[var(--foreground)]/82">
        <h3 className="obsidian-label mb-3 text-base">
          {lesson.title}
        </h3>
        <Markdown content={lesson.explanation} />
        <h3 className="obsidian-label mt-7 mb-3 text-base">
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
      className="obsidian-panel shrink-0 w-8 flex items-center justify-center text-[var(--foreground)]/48 hover:text-[var(--accent)] hover:bg-white/6 transition-colors cursor-pointer"
    >
      &#8250;
    </button>
  );

  return (
    <div className="obsidian-screen h-screen flex flex-col">
      <BackgroundMusic enabled={soundOn} />
      <span className="obsidian-ambient" aria-hidden="true" />
      <span className="obsidian-corner obsidian-corner-tl" aria-hidden="true" />
      <span className="obsidian-corner obsidian-corner-tr" aria-hidden="true" />
      <span className="obsidian-corner obsidian-corner-bl" aria-hidden="true" />
      <span className="obsidian-corner obsidian-corner-br" aria-hidden="true" />
      <div ref={fxRef} className={donePending ? "fx-done-submit" : ""} aria-hidden="true" />
      <LessonHeader
        topicName={topic.name}
        lessons={lessonsList}
        currentLessonId={lesson.id}
        prevLessonId={prevLessonId}
        nextLessonId={nextLessonId}
        checkingLessonId={donePending ? lesson.id : null}
        musicEnabled={soundOn}
        onMusicToggle={setSoundOn}
        soundEffectsEnabled={soundEffectsEnabled}
        onSoundEffectsToggle={setSoundEffectsEnabled}
        musicVolume={musicVolume}
        onMusicVolumeChange={setMusicVolume}
        rightSlot={
          isChatStep ? (
            <button
              type="button"
              onClick={() => setShowExplanation((v) => !v)}
              className="obsidian-action obsidian-label border border-[var(--border)] px-3 py-2 text-[10px] text-[var(--foreground)]/68 hover:bg-white/7 hover:text-[var(--accent)] cursor-pointer"
            >
              {showExplanation ? "Hide explanation" : "Show explanation"}
            </button>
          ) : null
        }
      />

      <div className="flex-1 min-h-0 flex gap-3 px-6">
        {isChatStep ? (
          <>
            {/* Column 1 — lesson reference (collapsible) — same in TASK and FEEDBACK */}
            {referenceColumn}

            {/* Column 2 — task prompt + chat (TASK) or post-pass chat (FEEDBACK) */}
            {isTask ? (
              <div className="obsidian-panel flex-1 min-w-0 flex flex-col overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTask((v) => !v)}
                  title={showTask ? "Collapse task" : "Show task"}
                  className="shrink-0 w-full px-4 py-3 border-b border-[var(--border)] flex items-center gap-3 text-left hover:bg-white/6 transition-colors cursor-pointer"
                >
                  <span className="text-[var(--warning)] text-xs">
                    {showTask ? "▾" : "▸"}
                  </span>
                  <span className="obsidian-label">
                    Task
                  </span>
                </button>
                {showTask && (
                  <div className="shrink-0 max-h-[34%] overflow-y-auto border-b border-[var(--border)] px-4 pb-4 pt-1">
                    <p className="text-sm text-[var(--foreground)]/74 whitespace-pre-wrap leading-relaxed">
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
                    externalPendingLabel={
                      donePending ? "Tutor is checking your work" : null
                    }
                  />
                </div>
              </div>
            ) : (
              // FEEDBACK — banner with score + Next button on top, chat fills the rest
              <div className="obsidian-panel flex-1 min-w-0 flex flex-col overflow-hidden">
                <div className="shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center gap-3">
                  <ConfidenceBadge score={confidence} />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`obsidian-label ${
                        passed
                          ? "text-[var(--success)]"
                          : "text-[var(--warning)]"
                      }`}
                    >
                      {passed ? "Passed" : "Needs work"}
                    </div>
                    <div className="text-xs text-[var(--foreground)]/50">
                      Ask follow-up questions, or move on whenever you are ready.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="obsidian-action obsidian-label obsidian-primary shrink-0 px-4 py-2 text-sm cursor-pointer"
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
              <div className="obsidian-panel w-[42%] min-w-[300px] shrink-0 overflow-hidden">
                <TerminalPanel
                  progressId={progressId}
                  visible={isTask}
                  onDone={submitDone}
                  donePending={donePending}
                />
              </div>
            )}
          </>
        ) : (
          // COMPLETED (or any unexpected step) — the lesson normally opens
          // straight into the TASK workspace, so this is just a graceful end state.
          <div className="flex flex-1 min-w-0 flex-col items-center justify-center p-8">
            <div className="obsidian-panel-strong p-8 max-w-md w-full text-center space-y-4">
              <div className="text-4xl text-[var(--success)]">&#10003;</div>
              <h2 className="obsidian-label text-xl">
                Lesson complete!
              </h2>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="obsidian-action obsidian-label obsidian-primary px-6 py-2.5 text-sm"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-6 py-4">
        <div className="obsidian-panel-strong mx-auto flex max-w-6xl items-center gap-5 px-6 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 ${
                donePending ? "animate-pulse bg-[var(--warning)]" : "bg-[var(--success)]"
              }`}
            />
            <span className="obsidian-label">
              {donePending ? "Checking" : "Tutor Online"}
            </span>
          </div>
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="obsidian-label text-[var(--foreground)]/76">
            {sessionMinutes}:{sessionRemainder}
          </span>
          <span className="obsidian-label text-[var(--foreground)]/54">
            Confidence {confidence}/10
          </span>
          <span className="obsidian-label text-[var(--foreground)]/54">
            State {tutorState}
          </span>
          <button
            type="button"
            onClick={() => setSoundOn((value) => !value)}
            className="obsidian-action obsidian-label border border-[var(--border)] px-3 py-1.5 text-[10px] hover:bg-white/6"
          >
            Sound{" "}
            <span className={soundOn ? "text-[var(--success)]" : "text-[var(--warning)]"}>
              {soundOn ? "On" : "Off"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
