import Anthropic, { APIError } from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Anthropic occasionally returns 429 / 529 ("Overloaded"); the SDK retries
  // these with exponential backoff. Give it a few more shots than the default.
  maxRetries: 5,
  timeout: 60_000,
});

const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** True for transient Anthropic errors worth one more local retry. */
function isTransient(err: unknown): boolean {
  if (err instanceof APIError) {
    return (
      err.status === 429 ||
      err.status === 529 ||
      (typeof err.status === "number" && err.status >= 500)
    );
  }
  return false;
}

export async function askClaude(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
      const block = response.content[0];
      if (block && block.type === "text") return block.text;
      return "";
    } catch (err) {
      lastError = err;
      if (!isTransient(err) || attempt === 2) throw err;
      await sleep(1500 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function askClaudeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  validate?: (value: unknown) => T
): Promise<T> {
  let lastError: unknown;
  let prompt = userMessage;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const text = await askClaude(
      systemPrompt +
        "\n\nCRITICAL: Your response must be valid JSON only. No markdown fences, no prose before or after. Ensure all strings are properly escaped (use \\\\n for newlines in strings).",
      prompt
    );

    try {
      let jsonStr = extractJSON(text);
      // Fix common issue: literal newlines inside JSON strings
      jsonStr = fixNewlinesInJsonStrings(jsonStr);
      const parsed = JSON.parse(jsonStr);
      return validate ? validate(parsed) : (parsed as T);
    } catch (error) {
      lastError = error;
      prompt = `Your previous response could not be parsed as valid JSON.

Error: ${error instanceof Error ? error.message : String(error)}

Return the same answer as valid JSON only. No markdown fences, no prose, no comments. Make sure all string values are on a single line with escaped newlines.`;
    }
  }

  throw new Error(
    `Claude returned invalid JSON: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

/**
 * Walk through a JSON string and replace literal newlines/tabs inside
 * quoted values with their escaped equivalents.
 */
function fixNewlinesInJsonStrings(json: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }

    if (inString) {
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { continue; }
      if (ch === "\t") { out += "\\t"; continue; }
    }

    out += ch;
  }

  return out;
}

function extractJSON(text: string): string {
  const trimmed = text.trim();

  // Only unwrap a code fence if the WHOLE response is fenced. Otherwise a
  // ``` that appears *inside* a JSON string value (e.g. a task description
  // containing a markdown code block) would be mistaken for the wrapper and
  // we'd extract the wrong slice.
  if (trimmed.startsWith("```")) {
    const fenced = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i);
    if (fenced) return fenced[1].trim();
  }

  const firstObject = trimmed.indexOf("{");
  const firstArray = trimmed.indexOf("[");
  const starts = [firstObject, firstArray].filter((i) => i >= 0);
  const start = starts.length ? Math.min(...starts) : -1;
  if (start < 0) return trimmed;

  const opener = trimmed[start];
  const closer = opener === "{" ? "}" : "]";
  const end = trimmed.lastIndexOf(closer);
  return end > start ? trimmed.slice(start, end + 1).trim() : trimmed;
}
