import { NextRequest, NextResponse } from "next/server";
import { listTeams, PagerDutyError } from "@/lib/pagerduty";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const apiToken =
    params.get("apiToken") || process.env.PAGERDUTY_API_TOKEN || "";

  if (!apiToken) {
    return NextResponse.json(
      { error: "API token is required" },
      { status: 400 }
    );
  }

  try {
    const teams = await listTeams(apiToken);
    return NextResponse.json({ teams });
  } catch (err) {
    if (err instanceof PagerDutyError) {
      return NextResponse.json(
        { error: `PagerDuty API error: ${err.message}` },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
