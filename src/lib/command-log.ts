import { prisma } from "./prisma";

export async function addCommand(progressId: string, command: string) {
  await prisma.turn.create({
    data: {
      progressId,
      step: "TASK",
      role: "system",
      content: command,
      metadata: { type: "command" },
    },
  });
}

export async function getCommandLog(progressId: string): Promise<string[]> {
  const turns = await prisma.turn.findMany({
    where: {
      progressId,
      step: "TASK",
      role: "system",
      metadata: { path: ["type"], equals: "command" },
    },
    orderBy: { createdAt: "asc" },
    select: { content: true },
  });

  return turns.map((turn) => turn.content);
}

export async function clearCommandLog(progressId: string) {
  await prisma.turn.deleteMany({
    where: {
      progressId,
      step: "TASK",
      role: "system",
      metadata: { path: ["type"], equals: "command" },
    },
  });
}
