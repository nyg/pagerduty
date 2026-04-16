import { NextResponse } from "next/server";

export async function GET() {
  const hasServerToken = !!process.env.PAGERDUTY_API_TOKEN;

  return NextResponse.json({ hasServerToken });
}
