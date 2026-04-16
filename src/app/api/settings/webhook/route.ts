import { NextRequest, NextResponse } from "next/server";
import {
  createWebhookSubscription,
  deleteWebhookSubscription,
  PagerDutyError,
} from "@/lib/pagerduty";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiToken = body.apiToken || process.env.PAGERDUTY_API_TOKEN || "";
  const { ngrokUrl, teamId, oldSubscriptionId } = body;

  if (!apiToken) {
    return NextResponse.json(
      { error: "API token is required" },
      { status: 400 }
    );
  }

  try {
    // Clean up old subscription if exists
    if (oldSubscriptionId) {
      try {
        await deleteWebhookSubscription(apiToken, oldSubscriptionId);
      } catch {
        // Ignore errors deleting old subscription (may already be gone)
      }
    }

    if (!ngrokUrl) {
      // Just deleting, no new subscription
      return NextResponse.json({ deleted: true });
    }

    const deliveryUrl = `${ngrokUrl}/api/webhooks/pagerduty`;
    const result = await createWebhookSubscription(apiToken, {
      deliveryUrl,
      teamId,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PagerDutyError) {
      return NextResponse.json(
        { error: `PagerDuty API error: ${err.message}` },
        { status: err.status }
      );
    }
    console.error("Failed to manage webhook subscription:", err);
    return NextResponse.json(
      { error: "Failed to manage webhook subscription" },
      { status: 500 }
    );
  }
}
