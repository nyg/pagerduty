import { NextRequest, NextResponse } from "next/server";
import { listAlerts, PagerDutyError } from "@/lib/pagerduty";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const apiToken =
    searchParams.get("apiToken") || process.env.PAGERDUTY_API_TOKEN || "";

  if (!apiToken) {
    return NextResponse.json(
      { error: "API token is required" },
      { status: 400 }
    );
  }

  try {
    const alerts = await listAlerts(apiToken, id);
    return NextResponse.json({ alerts });
  } catch (err) {
    if (err instanceof PagerDutyError) {
      return NextResponse.json(
        { error: `PagerDuty API error: ${err.message}` },
        { status: err.status }
      );
    }
    console.error("Failed to fetch alerts:", err);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
