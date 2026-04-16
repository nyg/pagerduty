import { NextResponse } from "next/server";

export async function GET() {
  const hasServerToken = !!process.env.PAGERDUTY_API_TOKEN;
  const teamId = process.env.PAGERDUTY_TEAM_ID ?? "";

  return NextResponse.json({ hasServerToken, teamId });
}
