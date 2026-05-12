import { advanceLesson } from "@/lib/orchestrator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ progressId: string }> }
) {
  const { progressId } = await params;

  const result = await advanceLesson(progressId, "hint");

  return Response.json({ hint: result.tutorMessage });
}
