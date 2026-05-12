"use client";

import { useRef, useEffect, useState } from "react";

interface Turn {
  id: string;
  role: string;
  content: string;
  step: string;
}

interface AdvanceResult {
  tutorMessage: string;
  newStep: string;
  confidence: number;
  completed: boolean;
  feedback?: string;
}

interface ChatPanelProps {
  progressId: string;
  onDone: (result: AdvanceResult) => void;
  /** Controlled list of turns rendered in the panel. */
  turns: Turn[];
  /** Append a new turn to the parent's list. */
  onAppendTurn: (turn: Turn) => void;
  /** Optional placeholder for the input box (defaults to a generic prompt). */
  placeholder?: string;
}

const draftStore = new Map<string, string>();

export default function ChatPanel({
  progressId,
  onDone,
  turns,
  onAppendTurn,
  placeholder,
}: ChatPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTurnRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = draftStore.get(progressId) ?? "";
    }
  }, [progressId]);

  useEffect(() => {
    const last = turns[turns.length - 1];
    if (last && last.role !== "student" && lastTurnRef.current) {
      // A new tutor/hint message arrived — line up its *top* so the student
      // reads it from the start (long answers don't dump them at the bottom).
      lastTurnRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [turns]);

  useEffect(() => {
    if (pending) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [pending]);

  const send = async (message: string) => {
    if (!message.trim() || pending) return;

    const trimmed = message.trim();
    if (inputRef.current) inputRef.current.value = "";
    draftStore.delete(progressId);

    onAppendTurn({
      id: `student-${Date.now()}`,
      role: "student",
      content: trimmed,
      step: "TASK",
    });
    setPending(true);

    try {
      const res = await fetch(`/api/lesson/${progressId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        onAppendTurn({
          id: `error-${Date.now()}`,
          role: "tutor",
          content:
            data?.error ?? "Something went wrong sending that — try again.",
          step: "TASK",
        });
        return;
      }

      const result = (await res.json()) as AdvanceResult;

      onAppendTurn({
        id: `tutor-${Date.now()}`,
        role: "tutor",
        content: result.tutorMessage,
        step: result.newStep,
      });

      if (trimmed.toLowerCase() === "done") {
        onDone(result);
      }
    } catch (err) {
      console.error("send failed:", err);
      onAppendTurn({
        id: `error-${Date.now()}`,
        role: "tutor",
        content: "Couldn't reach the server — check your connection and try again.",
        step: "TASK",
      });
    } finally {
      setPending(false);
    }
  };

  const requestHint = async () => {
    if (pending) return;
    setPending(true);

    try {
      const res = await fetch(`/api/lesson/${progressId}/hint`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`Hint request failed: ${res.status}`);
      const data = await res.json();

      onAppendTurn({
        id: `hint-${Date.now()}`,
        role: "tutor",
        content: data.hint || "No hint available.",
        step: "TASK",
      });
    } catch (err) {
      console.error("hint failed:", err);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.map((t, i) => (
          <div
            key={t.id}
            ref={i === turns.length - 1 ? lastTurnRef : undefined}
            className={`flex scroll-mt-4 ${
              t.role === "student" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                t.role === "student"
                  ? "bg-[var(--accent-dim)] text-white"
                  : "bg-[var(--panel)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              <div className="whitespace-pre-wrap">{t.content}</div>
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                >
                  .
                </span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                >
                  .
                </span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[var(--border)] p-4 flex gap-3">
        <button
          type="button"
          onClick={requestHint}
          disabled={pending}
          className="text-xs text-[var(--foreground)]/50 hover:text-[var(--accent)] border border-[var(--border)] rounded-lg px-3 py-2.5 transition-colors disabled:opacity-40"
        >
          Need a hint?
        </button>
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          onInput={(e) => draftStore.set(progressId, e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send(e.currentTarget.value);
          }}
          disabled={pending}
          placeholder={
            placeholder ?? 'Type "done" when finished, or ask a question...'
          }
          className="flex-1 bg-[var(--panel)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:outline-none focus:border-[var(--accent)] disabled:opacity-40"
        />
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) void send(inputRef.current.value);
          }}
          disabled={pending}
          className="bg-[var(--accent)] text-[var(--background)] font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
