import { NextRequest, NextResponse } from "next/server";
import { listIncidents, PagerDutyError } from "@/lib/pagerduty";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const apiToken =
    params.get("apiToken") || process.env.PAGERDUTY_API_TOKEN || "";
  const teamId = params.get("teamId") || "";
  const limit = Number(params.get("limit") || "30");
  const offset = Number(params.get("offset") || "0");
  const statuses = params.get("statuses")?.split(",") || [
    "triggered",
    "acknowledged",
    "resolved",
  ];

  if (!apiToken) {
    return NextResponse.json(
      { error: "API token is required" },
      { status: 400 }
    );
  }

  try {
    const result = await listIncidents(apiToken, {
      teamIds: teamId ? [teamId] : undefined,
      statuses,
      limit,
      offset,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PagerDutyError) {
      return NextResponse.json(
        { error: `PagerDuty API error: ${err.message}` },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}
