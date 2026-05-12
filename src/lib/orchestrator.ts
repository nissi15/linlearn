import { prisma } from "./prisma";
import { askClaude, askClaudeJSON } from "./claude";
import { createSandbox, inspectState, sandboxExists } from "./sandbox";
import { getCommandLog } from "./command-log";
import { verifyTaskPrompt } from "./prompts/verify-task";
import { socraticHintPrompt } from "./prompts/socratic-hint";
import { answerTaskQuestionPrompt } from "./prompts/answer-task-question";
import { answerFeedbackQuestionPrompt } from "./prompts/answer-feedback-question";

interface AdvanceResult {
  tutorMessage: string;
  step: string;
  sandboxAvailable: boolean;
  confidence: number;
  completed: boolean;
  lessonId: string;
  topicId: string;
}

interface VerifyResult {
  confidence: number;
  feedback: string;
  passed: boolean;
  observations: string[];
}

interface RetryTaskResult {
  taskPrompt: string;
  setupCommands: string[];
  successCriteria: Array<{
    check_command: string;
    expected_output: string;
    description: string;
  }>;
}

type SuccessCriterion = {
  check_command: string;
  expected_output: string;
  description: string;
};

async function saveTurn(
  progressId: string,
  step: string,
  role: string,
  content: string,
  metadata?: unknown
) {
  await prisma.turn.create({
    data: {
      progressId,
      step,
      role,
      content,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });
}

function getTaskData(progress: {
  retryTask: unknown;
  lesson: {
    taskPrompt: string;
    setupCommands: unknown;
    successCriteria: unknown;
  };
}): {
  taskPrompt: string;
  setupCommands: string[];
  successCriteria: SuccessCriterion[];
} {
  if (progress.retryTask) {
    const retry = progress.retryTask as RetryTaskResult;
    return {
      taskPrompt: retry.taskPrompt,
      setupCommands: retry.setupCommands,
      successCriteria: retry.successCriteria,
    };
  }
  return {
    taskPrompt: progress.lesson.taskPrompt,
    setupCommands: progress.lesson.setupCommands as string[],
    successCriteria: progress.lesson.successCriteria as SuccessCriterion[],
  };
}

export async function advanceLesson(
  progressId: string,
  studentMessage?: string
): Promise<AdvanceResult> {
  const progress = await prisma.lessonProgress.findUniqueOrThrow({
    where: { id: progressId },
    include: { lesson: true },
  });

  const { lesson } = progress;
  const base = {
    lessonId: lesson.id,
    topicId: lesson.topicId,
  };

  switch (progress.step) {
    // ── EXPLAIN ──────────────────────────────────────────────
    case "EXPLAIN": {
      await saveTurn(progressId, "EXPLAIN", "tutor", lesson.explanation);
      await prisma.lessonProgress.update({
        where: { id: progressId },
        data: { step: "EXAMPLE" },
      });
      return {
        tutorMessage: lesson.explanation,
        step: "EXAMPLE",
        sandboxAvailable: false,
        confidence: 0,
        completed: false,
        ...base,
      };
    }

    // ── EXAMPLE ──────────────────────────────────────────────
    case "EXAMPLE": {
      await saveTurn(progressId, "EXAMPLE", "tutor", lesson.example);

      // Pre-create the sandbox so the terminal can connect immediately
      const taskData = getTaskData(progress);
      const sandboxDir = createSandbox(progressId, taskData.setupCommands);

      await prisma.lessonProgress.update({
        where: { id: progressId },
        data: { step: "TASK", sandboxDir },
      });
      return {
        tutorMessage: lesson.example,
        step: "TASK",
        sandboxAvailable: true,
        confidence: 0,
        completed: false,
        ...base,
      };
    }

    // ── TASK ─────────────────────────────────────────────────
    case "TASK": {
      const taskData = getTaskData(progress);

      // Create sandbox if it doesn't exist yet (or was cleaned up)
      if (!progress.sandboxDir || !sandboxExists(progress.sandboxDir)) {
        const sandboxDir = createSandbox(progressId, taskData.setupCommands);
        await prisma.lessonProgress.update({
          where: { id: progressId },
          data: { sandboxDir },
        });
      }

      // Student says "done" — verify the task
      if (
        studentMessage &&
        studentMessage.toLowerCase().trim() === "done"
      ) {
        await saveTurn(progressId, "TASK", "student", studentMessage);

        const currentProgress = await prisma.lessonProgress.findUniqueOrThrow({
          where: { id: progressId },
        });

        const criteriaResults = await inspectState(
          currentProgress.sandboxDir,
          taskData.successCriteria
        );
        const commandLog = await getCommandLog(progressId);

        const sysPrompt = verifyTaskPrompt(
          lesson.title,
          taskData.taskPrompt,
          criteriaResults,
          commandLog
        );

        const result = await askClaudeJSON<VerifyResult>(
          sysPrompt,
          "Verify the student's task completion."
        );

        await saveTurn(progressId, "TASK", "judge", JSON.stringify(result), result);

        await prisma.lessonProgress.update({
          where: { id: progressId },
          data: {
            step: "FEEDBACK",
            confidence: result.confidence,
          },
        });

        return handleFeedback(progressId, result, base);
      }

      // Student asks for a hint
      if (
        studentMessage &&
        ["hint", "help"].includes(studentMessage.toLowerCase().trim())
      ) {
        await saveTurn(progressId, "TASK", "student", studentMessage);

        const currentProgress = await prisma.lessonProgress.findUniqueOrThrow({
          where: { id: progressId },
        });

        const commandLog = await getCommandLog(progressId);

        const criteriaResults = await inspectState(
          currentProgress.sandboxDir,
          taskData.successCriteria
        );
        const failing = criteriaResults.filter((c) => !c.passed);

        const sysPrompt = socraticHintPrompt(
          lesson.title,
          taskData.taskPrompt,
          commandLog,
          failing
        );

        const hint = await askClaude(sysPrompt, "Give the student a hint.");
        await saveTurn(progressId, "TASK", "tutor", hint);

        return {
          tutorMessage: hint,
          step: "TASK",
          sandboxAvailable: true,
          confidence: 0,
          completed: false,
          ...base,
        };
      }

      // First arrival at TASK (no message) — print the task.
      if (!studentMessage) {
        const msg = `Here's your task:\n\n${taskData.taskPrompt}\n\nUse the terminal to complete it. Type **done** when finished, or **hint** if you need help.`;
        await saveTurn(progressId, "TASK", "tutor", msg);
        return {
          tutorMessage: msg,
          step: "TASK",
          sandboxAvailable: true,
          confidence: 0,
          completed: false,
          ...base,
        };
      }

      // Free-form question during the task → Socratic answer that doesn't
      // give away the solution.
      await saveTurn(progressId, "TASK", "student", studentMessage);

      const taskQuestionProgress = await prisma.lessonProgress.findUniqueOrThrow({
        where: { id: progressId },
      });
      const taskQuestionCommandLog = await getCommandLog(progressId);
      const taskQuestionCriteria = await inspectState(
        taskQuestionProgress.sandboxDir,
        taskData.successCriteria
      );
      const taskQuestionFailing = taskQuestionCriteria.filter((c) => !c.passed);

      const taskQuestionAnswer = await askClaude(
        answerTaskQuestionPrompt(
          lesson.title,
          taskData.taskPrompt,
          studentMessage,
          taskQuestionCommandLog,
          taskQuestionFailing
        ),
        studentMessage
      );
      await saveTurn(progressId, "TASK", "tutor", taskQuestionAnswer);

      return {
        tutorMessage: taskQuestionAnswer,
        step: "TASK",
        sandboxAvailable: true,
        confidence: 0,
        completed: false,
        ...base,
      };
    }

    // ── FEEDBACK ─────────────────────────────────────────────
    case "FEEDBACK": {
      const lastJudgeTurn = await prisma.turn.findFirst({
        where: { progressId, role: "judge" },
        orderBy: { createdAt: "desc" },
      });

      // Follow-up question after passing (or after running out of attempts).
      // The student has already finished the lesson, so we answer fully
      // instead of restricting to Socratic nudges.
      if (studentMessage) {
        await saveTurn(progressId, "FEEDBACK", "student", studentMessage);

        const verify = lastJudgeTurn
          ? (JSON.parse(lastJudgeTurn.content) as VerifyResult)
          : null;
        const feedbackCommandLog = await getCommandLog(progressId);

        const feedbackAnswer = await askClaude(
          answerFeedbackQuestionPrompt(
            lesson.title,
            lesson.explanation,
            lesson.example,
            studentMessage,
            feedbackCommandLog,
            verify
          ),
          studentMessage
        );
        await saveTurn(progressId, "FEEDBACK", "tutor", feedbackAnswer);

        return {
          tutorMessage: feedbackAnswer,
          step: "FEEDBACK",
          sandboxAvailable: false,
          confidence: progress.confidence,
          completed: progress.completed,
          ...base,
        };
      }

      if (!lastJudgeTurn) {
        return {
          tutorMessage: "Something went wrong. Let me reassess your work.",
          step: "TASK",
          sandboxAvailable: true,
          confidence: 0,
          completed: false,
          ...base,
        };
      }

      const result = JSON.parse(lastJudgeTurn.content) as VerifyResult;
      return handleFeedback(progressId, result, base);
    }

    // ── COMPLETED / unknown ──────────────────────────────────
    default: {
      return {
        tutorMessage: "This lesson is already completed.",
        step: progress.step,
        sandboxAvailable: false,
        confidence: progress.confidence,
        completed: true,
        ...base,
      };
    }
  }
}

async function handleFeedback(
  progressId: string,
  result: VerifyResult,
  base: { lessonId: string; topicId: string }
): Promise<AdvanceResult> {
  const progress = await prisma.lessonProgress.findUniqueOrThrow({
    where: { id: progressId },
    include: { lesson: true },
  });

  // Passed: the verifier flagged it complete AND is confident about it.
  if (result.passed && result.confidence >= 7) {
    await prisma.lessonProgress.update({
      where: { id: progressId },
      data: { completed: true, step: "FEEDBACK" },
    });
    await saveTurn(progressId, "FEEDBACK", "tutor", result.feedback);

    return {
      tutorMessage: result.feedback,
      step: "FEEDBACK",
      sandboxAvailable: false,
      confidence: result.confidence,
      completed: true,
      ...base,
    };
  }

  const attempts = progress.attempts + 1;

  // Not there yet, but still has tries left. Keep the SAME task and the SAME
  // sandbox (their work isn't thrown away) — just give them the feedback and
  // let them fix it and run `done` again.
  if (attempts < 4) {
    await prisma.lessonProgress.update({
      where: { id: progressId },
      data: { attempts, step: "TASK" },
    });

    const msg = `${result.feedback}\n\nFix that in the terminal, then type **done** again — or ask me a question / type **hint** if you're stuck.`;
    await saveTurn(progressId, "TASK", "tutor", msg);

    return {
      tutorMessage: msg,
      step: "TASK",
      sandboxAvailable: true,
      confidence: result.confidence,
      completed: false,
      ...base,
    };
  }

  // Out of attempts — let them move on (they can always revisit later).
  await prisma.lessonProgress.update({
    where: { id: progressId },
    data: { completed: true, step: "FEEDBACK", attempts },
  });

  const msg = `${result.feedback}\n\nThat's a few tries — let's move on for now. You can always come back to this lesson.`;
  await saveTurn(progressId, "FEEDBACK", "tutor", msg);

  return {
    tutorMessage: msg,
    step: "FEEDBACK",
    sandboxAvailable: false,
    confidence: result.confidence,
    completed: true,
    ...base,
  };
}

export async function getNextLesson(
  topicId: string
): Promise<{ id: string; title: string; order: number } | null> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      topicId,
      progress: {
        none: { completed: true },
      },
    },
    orderBy: { order: "asc" },
    select: { id: true, title: true, order: true },
  });

  return lesson;
}
