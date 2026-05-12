export function scoreTopicTestPrompt(
  topicName: string,
  questions: Array<{ question: string }>,
  criteriaResults: Array<
    Array<{
      check_command: string;
      expected_output: string;
      actual: string;
      passed: boolean;
      description: string;
    }>
  >,
  commandLog: string[]
): string {
  const questionsBlock = questions
    .map((q, i) => {
      const results = criteriaResults[i] || [];
      const resultsStr = results
        .map(
          (c, j) =>
            `  ${j + 1}. ${c.description} — ${c.passed ? "PASSED" : "FAILED"} (expected: ${c.expected_output}, got: ${c.actual})`
        )
        .join("\n");
      return `Question ${i + 1}: ${q.question}\nResults:\n${resultsStr}`;
    })
    .join("\n\n");

  const logBlock =
    commandLog.length > 0
      ? commandLog.map((cmd, i) => `${i + 1}. ${cmd}`).join("\n")
      : "(no commands recorded)";

  return `You are scoring a topic test for "${topicName}" in a Linux tutoring system.

Questions and results:
${questionsBlock}

Student's command history:
${logBlock}

Score the overall test:
1. Give a per-question pass/fail with brief feedback.
2. Identify any weak areas (which lessons need review).
3. Give an overall confidence score 0-10.

Output JSON only:
{
  "confidence": <number 0-10>,
  "perQuestion": [
    { "passed": <boolean>, "feedback": "<brief feedback>" }
  ],
  "overallFeedback": "<summary of student performance>",
  "weakLessons": ["<lesson titles that need review>"]
}`;
}
