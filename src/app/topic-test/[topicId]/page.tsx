import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TopicTestClient from "@/components/TopicTestClient";

export default async function TopicTestPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, order: true },
      },
      topicTests: {
        where: { passed: false, confidence: 0 },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!topic) {
    notFound();
  }

  const lessonTitles = topic.lessons.map((l) => l.title);
  const existingTest = topic.topicTests[0] ?? null;

  return (
    <TopicTestClient
      topicId={topicId}
      topicName={topic.name}
      lessonTitles={lessonTitles}
      existingTestId={existingTest?.id ?? null}
    />
  );
}
