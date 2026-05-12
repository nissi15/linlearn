"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function startTopicAction(formData: FormData) {
  const topicId = formData.get("topicId");
  if (typeof topicId !== "string") {
    throw new Error("Missing topicId");
  }

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            select: { id: true, completed: true },
          },
        },
      },
    },
  });

  if (!topic || topic.lessons.length === 0) {
    throw new Error("Topic not found or has no lessons");
  }

  // Find the first lesson that isn't completed
  let targetLesson = topic.lessons.find(
    (l) => !l.progress.some((p) => p.completed)
  );

  // If all completed, go to topic test
  if (!targetLesson) {
    // Check if there's a passing topic test already
    const passingTest = await prisma.topicTest.findFirst({
      where: { topicId, passed: true },
    });
    if (passingTest) {
      // Already passed — restart from first lesson for review
      targetLesson = topic.lessons[0];
    } else {
      // All lessons done but no passing topic test — go to topic test
      redirect(`/topic-test/${topicId}`);
    }
  }

  // Check if there's an existing in-progress record
  const existingProgress = targetLesson.progress.find((p) => !p.completed);

  if (existingProgress) {
    redirect(`/lesson/${existingProgress.id}`);
  }

  // Create a new LessonProgress — sandboxDir stays empty until TASK step
  const progress = await prisma.lessonProgress.create({
    data: {
      lessonId: targetLesson.id,
      step: "EXPLAIN",
      sandboxDir: "",
    },
  });

  redirect(`/lesson/${progress.id}`);
}

export async function goToLessonAction(formData: FormData) {
  const lessonId = formData.get("lessonId");
  if (typeof lessonId !== "string") {
    throw new Error("Missing lessonId");
  }

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    throw new Error("Lesson not found");
  }

  // Reuse the most recent progress for this lesson if one exists, otherwise
  // start a fresh attempt at the EXPLAIN step.
  const existing = await prisma.lessonProgress.findFirst({
    where: { lessonId },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    redirect(`/lesson/${existing.id}`);
  }

  const progress = await prisma.lessonProgress.create({
    data: { lessonId, step: "EXPLAIN", sandboxDir: "" },
  });

  redirect(`/lesson/${progress.id}`);
}
