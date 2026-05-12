import { prisma } from "./prisma";
import { askClaudeJSON } from "./claude";
import { createSandbox, inspectState } from "./sandbox";
import { getCommandLog } from "./command-log";
import { topicTestPrompt } from "./prompts/topic-test";
import { scoreTopicTestPrompt } from "./prompts/score-topic-test";

interface Question {
  question: string;
  setupCommands: string[];
  successCriteria: Array<{
    check_command: string;
    expected_output: string;
    description: string;
  }>;
}

interface GeneratedQuestions {
  questions: Question[];
}

interface ScoreResult {
  confidence: number;
  passed: boolean;
  overallFeedback: string;
  perQuestion: Array<{ passed: boolean; feedback: string }>;
  weakLessons: string[];
}

interface ScoringResponse {
  confidence: number;
  perQuestion: Array<{ passed: boolean; feedback: string }>;
  overallFeedback: string;
  weakLessons: string[];
}

export async function startTopicTest(
  topicId: string
): Promise<{ testId: string; questions: Question[] }> {
  // 1. Fetch all lessons for the topic
  const lessons = await prisma.lesson.findMany({
    where: { topicId },
    orderBy: { order: "asc" },
    select: { title: true, taskPrompt: true },
  });

  if (lessons.length === 0) {
    throw new Error("No lessons found for this topic");
  }

  // Fetch topic name
  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: topicId },
    select: { name: true },
  });

  // 2. Generate 3 questions via Claude
  const lessonSummaries = lessons.map((l) => ({
    title: l.title,
    taskPrompt: l.taskPrompt,
  }));

  const prompt = topicTestPrompt(topic.name, lessonSummaries);
  const generated = await askClaudeJSON<GeneratedQuestions>(
    prompt,
    "Generate the topic test questions."
  );

  const questions = generated.questions;

  // 3. Create TopicTest record
  const test = await prisma.topicTest.create({
    data: {
      topicId,
      signals: JSON.parse(
        JSON.stringify({ questions, sandboxId: "" })
      ),
    },
  });

  // 4. Create sandbox with all setup commands combined
  // Reorder: file creation commands first, permission changes last
  const allSetupCommands = questions.flatMap((q) => q.setupCommands);
  const fileCommands = allSetupCommands.filter(
    (c) => !c.match(/^\s*chmod\b/)
  );
  const permCommands = allSetupCommands.filter(
    (c) => c.match(/^\s*chmod\b/)
  );
  createSandbox(test.id, [...fileCommands, ...permCommands], true);

  // Update the signals with the sandboxId (which is the testId)
  await prisma.topicTest.update({
    where: { id: test.id },
    data: {
      signals: JSON.parse(
        JSON.stringify({ questions, sandboxId: test.id })
      ),
    },
  });

  return { testId: test.id, questions };
}

export async function scoreTopicTest(testId: string): Promise<ScoreResult> {
  // 1. Load the TopicTest
  const test = await prisma.topicTest.findUniqueOrThrow({
    where: { id: testId },
    include: { topic: true },
  });

  const signals = test.signals as unknown as {
    questions: Question[];
    sandboxId: string;
  };

  const { questions, sandboxId } = signals;
  const sandboxDir = `/tmp/lessons/${sandboxId}`;

  // 2. For each question, inspect state
  const criteriaResults = await Promise.all(
    questions.map((q) => inspectState(sandboxDir, q.successCriteria))
  );

  // 3. Get command log
  const commandLog = await getCommandLog(testId);

  // 4. Call Claude to score
  const prompt = scoreTopicTestPrompt(
    test.topic.name,
    questions.map((q) => ({ question: q.question })),
    criteriaResults,
    commandLog
  );

  const scoring = await askClaudeJSON<ScoringResponse>(
    prompt,
    "Score this topic test."
  );

  const confidence = scoring.confidence;
  const passed = confidence >= 7;

  // 5. Update TopicTest record
  await prisma.topicTest.update({
    where: { id: testId },
    data: {
      confidence,
      passed,
    },
  });

  return {
    confidence,
    passed,
    overallFeedback: scoring.overallFeedback,
    perQuestion: scoring.perQuestion,
    weakLessons: scoring.weakLessons,
  };
}
