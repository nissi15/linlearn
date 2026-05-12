import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: { progress: true },
      },
    },
  });

  if (!topic) {
    return Response.json({ error: "Topic not found" }, { status: 404 });
  }

  const lessons = topic.lessons.map((lesson) => {
    const completedProgress = lesson.progress.find((p) => p.completed);
    const inProgressProgress = lesson.progress.find((p) => !p.completed);

    let status: "completed" | "in-progress" | "locked";
    let confidence = 0;

    if (completedProgress) {
      status = "completed";
      confidence = completedProgress.confidence;
    } else if (inProgressProgress) {
      status = "in-progress";
      confidence = inProgressProgress.confidence;
    } else {
      status = "locked";
    }

    return {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      status,
      confidence,
    };
  });

  const completedCount = lessons.filter((l) => l.status === "completed").length;

  return Response.json({
    topicId,
    topicName: topic.name,
    lessons,
    completedCount,
    totalCount: lessons.length,
  });
}
