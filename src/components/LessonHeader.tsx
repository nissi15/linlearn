"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { goToLessonAction } from "@/app/actions";

interface LessonItem {
  id: string;
  title: string;
  order: number;
  status: "completed" | "in-progress" | "locked";
  confidence: number;
}

interface LessonHeaderProps {
  topicName: string;
  lessons: LessonItem[];
  currentLessonId: string;
  prevLessonId: string | null;
  nextLessonId: string | null;
  /** Optional extra controls rendered on the right (e.g. explanation toggle). */
  rightSlot?: React.ReactNode;
}

function NavArrow({
  lessonId,
  children,
  title,
}: {
  lessonId: string | null;
  children: React.ReactNode;
  title: string;
}) {
  if (!lessonId) {
    return (
      <span className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--foreground)]/20 select-none">
        {children}
      </span>
    );
  }
  return (
    <form action={goToLessonAction}>
      <input type="hidden" name="lessonId" value={lessonId} />
      <button
        type="submit"
        title={title}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--foreground)]/60 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer"
      >
        {children}
      </button>
    </form>
  );
}

export default function LessonHeader({
  topicName,
  lessons,
  currentLessonId,
  prevLessonId,
  nextLessonId,
  rightSlot,
}: LessonHeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = lessons.find((l) => l.id === currentLessonId);
  const currentOrder = current?.order ?? 1;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <header className="shrink-0 border-b border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 flex items-center gap-4">
      <Link
        href="/"
        className="text-xs text-[var(--foreground)]/60 hover:text-[var(--accent)] transition-colors shrink-0"
      >
        &larr; Home
      </Link>

      <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider shrink-0 hidden sm:inline">
        {topicName}
      </span>

      <div className="flex items-center gap-1 min-w-0">
        <NavArrow lessonId={prevLessonId} title="Previous lesson">
          &#8249;
        </NavArrow>

        <div className="relative min-w-0" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/10 transition-colors min-w-0 cursor-pointer"
          >
            <span className="text-xs text-[var(--foreground)]/40 shrink-0">
              {currentOrder}/{lessons.length}
            </span>
            <span className="text-sm font-medium text-[var(--foreground)] truncate">
              {current?.title ?? "Lesson"}
            </span>
            <span className="text-[var(--foreground)]/40 text-xs shrink-0">
              &#9662;
            </span>
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-1 w-80 max-h-[60vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl z-50 p-1.5">
              {lessons.map((lesson) => {
                const isCurrent = lesson.id === currentLessonId;
                return (
                  <form
                    key={lesson.id}
                    action={goToLessonAction}
                    onSubmit={() => setOpen(false)}
                  >
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <button
                      type="submit"
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                          : "hover:bg-[var(--accent)]/5 text-[var(--foreground)]"
                      }`}
                    >
                      {lesson.status === "completed" ? (
                        <span className="w-5 h-5 rounded-full bg-[var(--success)] flex items-center justify-center shrink-0 text-[var(--background)] text-xs font-bold">
                          &#10003;
                        </span>
                      ) : lesson.status === "in-progress" ? (
                        <span className="w-5 h-5 rounded-full bg-[var(--accent)] shrink-0" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[var(--border)] shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {lesson.order}. {lesson.title}
                      </span>
                      {lesson.status === "completed" && (
                        <span className="text-xs text-[var(--success)]/80 shrink-0">
                          {lesson.confidence}/10
                        </span>
                      )}
                    </button>
                  </form>
                );
              })}
            </div>
          )}
        </div>

        <NavArrow lessonId={nextLessonId} title="Next lesson">
          &#8250;
        </NavArrow>
      </div>

      <div className="ml-auto shrink-0">{rightSlot}</div>
    </header>
  );
}
