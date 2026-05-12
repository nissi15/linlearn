import { APIError } from "@anthropic-ai/sdk";
import { advanceLesson } from "@/lib/orchestrator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ progressId: string }> }
) {
  const { progressId } = await params;

  let body: { message?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine for step advancement
  }

  const message = body.message?.trim() || undefined;

  try {
    const result = await advanceLesson(progressId, message);

    return Response.json({
      tutorMessage: result.tutorMessage,
      newStep: result.step,
      confidence: result.confidence,
      completed: result.completed,
      feedback: result.tutorMessage,
    });
  } catch (error) {
    console.error("advanceLesson error:", error);

    // Anthropic is sometimes momentarily overloaded (429 / 529) — tell the
    // student it's temporary so they just retry.
    if (
      error instanceof APIError &&
      (error.status === 429 || error.status === 529)
    ) {
      return Response.json(
        { error: "The tutor is busy right now — give it a few seconds and send that again." },
        { status: 503 }
      );
    }

    return Response.json(
      { error: "Failed to advance lesson. Please try again." },
      { status: 500 }
    );
  }
}
