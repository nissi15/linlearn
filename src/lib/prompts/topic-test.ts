export function topicTestPrompt(
  topicName: string,
  lessonSummaries: Array<{ title: string; taskPrompt: string }>
): string {
  const lessonsBlock = lessonSummaries
    .map((l, i) => `${i + 1}. "${l.title}": ${l.taskPrompt}`)
    .join("\n");

  return `You are a test generator for a Linux tutoring system. The student has completed all lessons in the topic "${topicName}".

Lessons covered:
${lessonsBlock}

Generate 3 terminal-based test questions that span all the lessons above. Each question should be a practical task the student must complete in a bash terminal. The questions should test understanding, not rote memorization. Mix concepts from different lessons where possible.

IMPORTANT rules for setup commands and criteria:
- All file paths must be RELATIVE (e.g., "touch myfile.txt", NOT "touch /home/user/myfile.txt")
- Commands run inside a sandbox working directory — never use absolute paths
- Keep setup commands simple: touch, chmod, mkdir -p, echo
- Keep check_commands simple: stat, test, cat, ls
- All 3 questions share the SAME sandbox directory, so use distinct filenames

Output JSON only:
{
  "questions": [
    {
      "question": "<the task description shown to the student>",
      "setupCommands": ["<bash commands using relative paths>"],
      "successCriteria": [
        {
          "check_command": "<bash command to verify using relative paths>",
          "expected_output": "<expected stdout>",
          "description": "<what this checks>"
        }
      ]
    }
  ]
}`;
}
