import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LessonClient from "@/components/LessonClient";
import { advanceLesson } from "@/lib/orchestrator";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ progressId: string }>;
}) {
  const { progressId } = await params;

  // The EXPLAIN/EXAMPLE steps used to be separate "click Next" pages; now the
  // lesson opens straight into the 3-column workspace (the explanation and the
  // worked example live in the Reference column there). Fast-forward through
  // those steps server-side. advanceLesson(EXPLAIN)→EXAMPLE→TASK also creates
  // the sandbox, so the terminal is ready by the time the page paints.
  const head = await prisma.lessonProgress.findUnique({
    where: { id: progressId },
    select: { step: true },
  });
  if (!head) {
    notFound();
  }
  let step = head.step;
  for (let i = 0; i < 4 && (step === "EXPLAIN" || step === "EXAMPLE"); i++) {
    const result = await advanceLesson(progressId);
    step = result.step;
  }

  const progress = await prisma.lessonProgress.findUnique({
    where: { id: progressId },
    include: {
      lesson: {
        include: {
          topic: true,
        },
      },
      turns: {
        orderBy: { createdAt: "asc" },
        where: { role: { in: ["tutor", "student"] } },
      },
    },
  });

  if (!progress) {
    notFound();
  }

  const lesson = progress.lesson;
  const topic = lesson.topic;

  // Build the lessons list for the sidebar
  const allLessons = await prisma.lesson.findMany({
    where: { topicId: topic.id },
    orderBy: { order: "asc" },
    include: {
      progress: {
        select: { completed: true, confidence: true },
      },
    },
  });

  const lessonsList = allLessons.map((l) => {
    let status: "completed" | "in-progress" | "locked" = "locked";
    let confidence = 0;

    if (l.progress.some((p) => p.completed)) {
      status = "completed";
      const completedProgress = l.progress.find((p) => p.completed);
      confidence = completedProgress?.confidence ?? 0;
    } else if (l.progress.some((p) => !p.completed)) {
      status = "in-progress";
    }

    return {
      id: l.id,
      title: l.title,
      order: l.order,
      status,
      confidence,
    };
  });

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLessonId =
    currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
  const nextLessonId =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1].id
      : null;

  const turns = progress.turns.map((t) => ({
    id: t.id,
    role: t.role,
    content: t.content,
    step: t.step,
  }));

  // Extract retryTaskPrompt from retryTask JSON if present
  const retryTaskPrompt = progress.retryTask
    ? (progress.retryTask as { taskPrompt?: string }).taskPrompt ?? null
    : null;

  return (
    <LessonClient
      progressId={progressId}
      lesson={{
        id: lesson.id,
        title: lesson.title,
        explanation: lesson.explanation,
        example: lesson.example,
        taskPrompt: lesson.taskPrompt,
        topicId: lesson.topicId,
      }}
      topic={{
        id: topic.id,
        name: topic.name,
      }}
      initialStep={progress.step}
      initialConfidence={progress.confidence}
      initialCompleted={progress.completed}
      initialTurns={turns}
      lessonsList={lessonsList}
      prevLessonId={prevLessonId}
      nextLessonId={nextLessonId}
      retryTaskPrompt={retryTaskPrompt}
    />
  );
}
