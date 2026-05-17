"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { goToLessonAction } from "@/app/actions";
import { playClickSound } from "@/lib/sound";
import MusicPlayer from "@/components/MusicPlayer";

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
  checkingLessonId?: string | null;
  /** Optional extra controls rendered on the right (e.g. explanation toggle). */
  rightSlot?: React.ReactNode;
  /** Music toggle callback */
  onMusicToggle?: (enabled: boolean) => void;
  musicEnabled?: boolean;
  soundEffectsEnabled?: boolean;
  onSoundEffectsToggle?: (enabled: boolean) => void;
  musicVolume?: number;
  onMusicVolumeChange?: (volume: number) => void;
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
      <span className="flex h-9 w-9 items-center justify-center text-[var(--foreground)]/18 select-none">
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
        onClick={playClickSound}
        className="obsidian-action flex h-9 w-9 items-center justify-center border border-transparent text-[var(--foreground)]/62 hover:border-[var(--border)] hover:bg-white/6 hover:text-[var(--accent)] cursor-pointer"
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
  checkingLessonId = null,
  rightSlot,
  onMusicToggle,
  musicEnabled = false,
  soundEffectsEnabled = true,
  onSoundEffectsToggle,
  musicVolume = 50,
  onMusicVolumeChange,
}: LessonHeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = lessons.find((l) => l.id === currentLessonId);
  const currentOrder = current?.order ?? 1;
  const isCheckingCurrent = checkingLessonId === currentLessonId;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-[1000] shrink-0 px-6 py-5 bg-[var(--background)]">
      <div className="obsidian-panel-strong flex w-full items-center gap-4 px-6 py-4">
        <Link
          href="/"
          className="obsidian-action obsidian-label text-2xl font-black tracking-normal hover:text-[var(--warning)] shrink-0"
        >
          LINLEARN
        </Link>

        <Link
          href="/"
          className="obsidian-action obsidian-label obsidian-primary px-4 py-2 text-[11px] shrink-0"
          title="Go home"
        >
          &larr; Home
        </Link>

      <span className="obsidian-label hidden shrink-0 sm:inline">
        {topicName}
      </span>

      <div className="flex items-center gap-1 min-w-0">
        <NavArrow lessonId={prevLessonId} title="Previous lesson">
          &#8249;
        </NavArrow>

        <div className="relative min-w-0" ref={ref}>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setOpen((o) => !o);
            }}
            className="obsidian-action flex min-w-0 cursor-pointer items-center gap-2 border border-transparent px-3 py-2 hover:border-[var(--border)] hover:bg-white/6"
          >
            <span className="text-xs text-[var(--foreground)]/42 shrink-0">
              {currentOrder}/{lessons.length}
            </span>
            <span className="obsidian-label truncate">
              {current?.title ?? "Lesson"}
            </span>
            {isCheckingCurrent && (
              <span
                className="inline-flex items-center gap-1.5 border border-[var(--warning)]/48 bg-[var(--warning)]/12 px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--warning)] shrink-0"
                aria-live="polite"
              >
                <span className="h-2 w-2 rounded-full border border-current border-t-transparent animate-spin" />
                Tutor checking...
              </span>
            )}
            <span className="text-[var(--foreground)]/45 text-xs shrink-0">
              &#9662;
            </span>
          </button>

          {open && (
            <div className="obsidian-panel-strong absolute left-0 top-full z-[1001] mt-2 max-h-[60vh] w-88 overflow-y-auto p-1.5">
              {lessons.map((lesson) => {
                const isCurrent = lesson.id === currentLessonId;
                const isChecking = lesson.id === checkingLessonId;
                return (
                  <form
                    key={lesson.id}
                    action={goToLessonAction}
                    onSubmit={() => {
                      playClickSound();
                      setOpen(false);
                    }}
                  >
                    <input type="hidden" name="lessonId" value={lesson.id} />
                    <button
                      type="submit"
                      onClick={playClickSound}
                      className={`obsidian-action w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left cursor-pointer ${
                        isCurrent
                          ? "bg-white/10 text-[var(--accent)]"
                          : "hover:bg-white/6 text-[var(--foreground)]"
                      }`}
                    >
                      {isChecking ? (
                        <span className="w-5 h-5 rounded-full border-2 border-[var(--warning)] border-t-transparent animate-spin shrink-0" />
                      ) : lesson.status === "completed" ? (
                        <span className="w-5 h-5 rounded-full bg-[var(--success)] flex items-center justify-center shrink-0 text-[var(--background)] text-xs font-bold">
                          &#10003;
                        </span>
                      ) : lesson.status === "in-progress" ? (
                        <span className="w-5 h-5 rounded-full bg-[var(--accent)] shrink-0" />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[var(--border)] shrink-0" />
                      )}
                      <span className="obsidian-label min-w-0 flex-1 truncate">
                        {lesson.order}. {lesson.title}
                      </span>
                      {isChecking && (
                        <span className="text-xs uppercase text-[var(--warning)]/90 shrink-0">
                          checking
                        </span>
                      )}
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

      <div className="ml-auto shrink-0 flex items-center gap-3">
        {onMusicToggle && (
          <MusicPlayer
            isPlaying={musicEnabled}
            onToggle={onMusicToggle}
            soundEffectsEnabled={soundEffectsEnabled}
            onSoundEffectsToggle={onSoundEffectsToggle || (() => {})}
            musicVolume={musicVolume}
            onMusicVolumeChange={onMusicVolumeChange || (() => {})}
          />
        )}
        {rightSlot}
      </div>
      </div>
    </header>
  );
}
