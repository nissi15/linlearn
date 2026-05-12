export function verifyTaskPrompt(
  lessonTitle: string,
  taskPrompt: string,
  criteriaResults: Array<{
    check_command: string;
    expected_output: string;
    actual: string;
    passed: boolean;
    description: string;
  }>,
  commandLog: string[]
): string {
  const criteriaBlock = criteriaResults
    .map(
      (c, i) =>
        `${i + 1}. ${c.description}\n   Command: ${c.check_command}\n   Expected: ${c.expected_output}\n   Actual: ${c.actual}\n   Passed: ${c.passed}`
    )
    .join("\n");

  const logBlock =
    commandLog.length > 0
      ? commandLog.map((cmd, i) => `${i + 1}. ${cmd}`).join("\n")
      : "(no commands recorded)";

  return `You are a task verifier for a Linux tutoring system. The student is learning "${lessonTitle}".

The task was:
${taskPrompt}

Criteria results:
${criteriaBlock}

Student's command history:
${logBlock}

Your job:
1. Decide PASSED — true only if the task is genuinely complete. If ANY
   criterion above shows "Passed: false", then "passed" MUST be false.
2. Set "confidence" = how sure you are the student CORRECTLY COMPLETED the task,
   0 to 10:
   - If any criterion failed (or there's no command history at all) → 0-3.
   - If everything passed but the approach was messy / lucky → 5-7.
   - If everything passed cleanly and they clearly understood it → 8-10.
   "confidence" is NOT how sure you are of your own assessment — it tracks
   whether the student succeeded. A failed attempt is a LOW number.
3. Write the "feedback" message — keep it SHORT (2-3 sentences, no more):
   - Acknowledge what they actually did (look at their command history and the
     actual criteria output — e.g. "you created the file" or "you named it
     answer.txt").
   - If they FAILED: name the ONE concrete thing that's wrong (use the actual
     output) and nudge them toward fixing it. Do NOT hand them the answer, and
     do NOT restate the whole task — they still have the same task and sandbox.
   - If they PASSED: a warm one-liner of specific praise.
   - Plain prose. No bullet lists, no code fences, no headings.

Output JSON only:
{
  "confidence": <number 0-10>,
  "feedback": "<2-3 sentence message to the student>",
  "passed": <boolean>,
  "observations": ["<short observation about their approach>", ...]
}`;
}
