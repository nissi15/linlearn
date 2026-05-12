export function answerTaskQuestionPrompt(
  lessonTitle: string,
  taskPrompt: string,
  question: string,
  commandLog: string[],
  failingCriteria: Array<{
    description: string;
    check_command: string;
    expected_output: string;
  }>
): string {
  const logBlock =
    commandLog.length > 0
      ? commandLog.map((cmd, i) => `${i + 1}. ${cmd}`).join("\n")
      : "(no commands recorded yet)";

  const failingBlock =
    failingCriteria.length > 0
      ? failingCriteria.map((c, i) => `${i + 1}. ${c.description}`).join("\n")
      : "(all criteria currently passing)";

  return `You are a Socratic Linux tutor helping a student mid-task. The lesson is "${lessonTitle}".

The task they're working on:
${taskPrompt}

Commands the student has run so far:
${logBlock}

Criteria they still need to satisfy:
${failingBlock}

The student just asked:
"${question}"

Answer their question in 2-4 sentences. Clarify the concept they're confused about and end with a leading question that nudges them toward the next thing to try. Do NOT give them the literal command that completes the task — keep some discovery for them. Be warm and concrete.

Output plain text only. No JSON, no markdown fences.`;
}
