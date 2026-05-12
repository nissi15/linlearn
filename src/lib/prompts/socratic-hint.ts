export function socraticHintPrompt(
  lessonTitle: string,
  taskPrompt: string,
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

  const failingBlock = failingCriteria
    .map((c, i) => `${i + 1}. ${c.description}`)
    .join("\n");

  return `You are a Socratic tutor helping a student with a Linux task. The lesson is "${lessonTitle}".

The task:
${taskPrompt}

Commands the student has run so far:
${logBlock}

What they still need to get right:
${failingBlock}

Give the student ONE leading question that guides them toward the answer without revealing it. Mention what concept they should think about. Be encouraging and warm. Keep it short (2-3 sentences max).

Output plain text only. No JSON, no markdown fences.`;
}
