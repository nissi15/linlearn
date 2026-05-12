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
    return Response.json(
      { error: "Failed to advance lesson. Please try again." },
      { status: 500 }
    );
  }
}
