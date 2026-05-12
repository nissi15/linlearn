import { prisma } from "@/lib/prisma";
import { startTopicAction } from "./actions";

interface LessonWithProgress {
  id: string;
  title: string;
  order: number;
  progress: Array<{ completed: boolean; confidence: number }>;
}

function computeStatus(
  progress: Array<{ completed: boolean; confidence: number }>
): "completed" | "in-progress" | "locked" {
  if (progress.some((p) => p.completed)) return "completed";
  if (progress.some((p) => !p.completed)) return "in-progress";
  return "locked";
}

function getConfidence(
  progress: Array<{ completed: boolean; confidence: number }>
): number {
  const completed = progress.find((p) => p.completed);
  return completed?.confidence ?? 0;
}

export default async function Home() {
  const topics = await prisma.topic.findMany({
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            select: { completed: true, confidence: true },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--accent)] mb-2">
          Linux Tutor
        </h1>
        <p className="text-[var(--foreground)]/60 mb-8">
          Master Linux concepts through guided lessons with hands-on practice.
        </p>

        <div className="space-y-6">
          {topics.map((topic) => {
            const completedCount = topic.lessons.filter((l) =>
              l.progress.some((p) => p.completed)
            ).length;
            const hasInProgress = topic.lessons.some(
              (l) => computeStatus(l.progress) === "in-progress"
            );
            const totalCount = topic.lessons.length;
            const progressPct =
              totalCount > 0
                ? Math.round((completedCount / totalCount) * 100)
                : 0;

            return (
              <div
                key={topic.id}
                className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                      {topic.name}
                    </h2>
                    <p className="text-sm text-[var(--foreground)]/60 mt-1">
                      {topic.description}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--foreground)]/40 font-mono shrink-0 ml-4">
                    {completedCount}/{totalCount}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[var(--border)] rounded-full mb-4">
                  <div
                    className="h-full bg-[var(--success)] rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Lesson list */}
                <div className="space-y-2 mb-4">
                  {topic.lessons.map((lesson: LessonWithProgress) => {
                    const status = computeStatus(lesson.progress);
                    const conf = getConfidence(lesson.progress);

                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        {status === "completed" ? (
                          <div className="w-4 h-4 rounded-full bg-[var(--success)] flex items-center justify-center shrink-0">
                            <span className="text-[var(--background)] text-[10px] font-bold">
                              &#10003;
                            </span>
                          </div>
                        ) : status === "in-progress" ? (
                          <div className="w-4 h-4 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-[var(--border)] shrink-0" />
                        )}
                        <span
                          className={
                            status === "locked"
                              ? "text-[var(--foreground)]/40"
                              : "text-[var(--foreground)]"
                          }
                        >
                          {lesson.title}
                        </span>
                        {status === "completed" && (
                          <span className="text-xs text-[var(--success)]/70 ml-auto">
                            {conf}/10
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Start / Continue button */}
                <form action={startTopicAction}>
                  <input type="hidden" name="topicId" value={topic.id} />
                  <button
                    type="submit"
                    className="bg-[var(--accent)] text-[var(--background)] font-semibold px-5 py-2 rounded-lg text-sm hover:bg-[var(--accent-dim)] transition-colors cursor-pointer"
                  >
                    {completedCount === totalCount
                      ? "Review"
                      : completedCount > 0 || hasInProgress
                      ? "Continue"
                      : "Start"}
                    {" →"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
