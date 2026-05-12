import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;

  const lessons = await prisma.lesson.findMany({
    where: { topicId },
    orderBy: { order: "asc" },
    include: { progress: true },
  });

  if (lessons.length === 0) {
    return Response.json({ error: "No lessons found for topic" }, { status: 404 });
  }

  // Check for an in-progress lesson (has an uncompleted LessonProgress)
  for (const lesson of lessons) {
    const inProgress = lesson.progress.find((p) => !p.completed);
    if (inProgress) {
      return Response.json({
        progressId: inProgress.id,
        lessonId: lesson.id,
        resumed: true,
      });
    }
  }

  // Find the first lesson with NO completed LessonProgress
  const nextLesson = lessons.find(
    (lesson) => !lesson.progress.some((p) => p.completed)
  );

  if (!nextLesson) {
    return Response.json({ allComplete: true, topicId });
  }

  // Create a new LessonProgress — sandboxDir stays empty until TASK step
  const newProgress = await prisma.lessonProgress.create({
    data: {
      lessonId: nextLesson.id,
      step: "EXPLAIN",
      sandboxDir: "",
    },
  });

  return Response.json({
    progressId: newProgress.id,
    lessonId: nextLesson.id,
    resumed: false,
  });
}
