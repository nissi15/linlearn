import { PrismaClient } from "@prisma/client";
import { curriculum } from "../src/seed/curriculum";

const prisma = new PrismaClient();

async function main() {
  for (const topic of curriculum) {
    await prisma.topic.upsert({
      where: { id: topic.id },
      update: {
        name: topic.name,
        description: topic.description,
        order: topic.order,
      },
      create: {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        order: topic.order,
      },
    });

    for (const lesson of topic.lessons) {
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: {
          topicId: topic.id,
          order: lesson.order,
          title: lesson.title,
          explanation: lesson.explanation,
          example: lesson.example,
          taskPrompt: lesson.taskPrompt,
          setupCommands: lesson.setupCommands,
          successCriteria: lesson.successCriteria,
        },
        create: {
          id: lesson.id,
          topicId: topic.id,
          order: lesson.order,
          title: lesson.title,
          explanation: lesson.explanation,
          example: lesson.example,
          taskPrompt: lesson.taskPrompt,
          setupCommands: lesson.setupCommands,
          successCriteria: lesson.successCriteria,
        },
      });
    }

    console.log(
      `Seeded topic "${topic.name}" with ${topic.lessons.length} lessons`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
