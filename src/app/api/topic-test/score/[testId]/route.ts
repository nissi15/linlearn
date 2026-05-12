import { scoreTopicTest } from "@/lib/topic-test-orchestrator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;

  try {
    const result = await scoreTopicTest(testId);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to score topic test";
    return Response.json({ error: message }, { status: 500 });
  }
}
