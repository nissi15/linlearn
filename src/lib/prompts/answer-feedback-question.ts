interface VerifySummary {
  confidence: number;
  feedback: string;
  observations: string[];
}

export function answerFeedbackQuestionPrompt(
  lessonTitle: string,
  lessonExplanation: string,
  lessonExample: string,
  question: string,
  commandLog: string[],
  verify: VerifySummary | null
): string {
  const logBlock =
    commandLog.length > 0
      ? commandLog.map((cmd, i) => `${i + 1}. ${cmd}`).join("\n")
      : "(no commands recorded)";

  const verifyBlock = verify
    ? `Score: ${verify.confidence}/10
Feedback they got: ${verify.feedback}
Observations from the grader:
${verify.observations.map((o, i) => `  ${i + 1}. ${o}`).join("\n")}`
    : "(no grader notes available)";

  return `The student has finished the lesson "${lessonTitle}". They passed (or used all their attempts) and are now asking deeper follow-up questions to solidify the concept. You can answer directly — no need to withhold the answer the way you would mid-task.

Lesson explanation they were taught:
${lessonExplanation}

Worked example from the lesson:
${lessonExample}

Their attempt summary:
${verifyBlock}

Commands they actually ran:
${logBlock}

The student is asking:
"${question}"

Answer their question clearly and concretely in 2-6 sentences. Give a real example (a command, a permission string, a scenario) when it helps. Feel free to go a little beyond the basic lesson if they're reaching for more depth. Be warm and direct.

Output plain text only. No JSON, no markdown fences.`;
}
