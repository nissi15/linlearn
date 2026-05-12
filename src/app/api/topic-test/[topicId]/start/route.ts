import { startTopicTest } from "@/lib/topic-test-orchestrator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;

  try {
    const result = await startTopicTest(topicId);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start topic test";
    return Response.json({ error: message }, { status: 500 });
  }
}
