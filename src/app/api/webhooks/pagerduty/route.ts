import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { addSSEEvent } from "./stream/clients";

// Webhook signing secrets stored in-memory (set via settings page)
// In production, these would be in a database
const signingSecrets = new Map<string, string>();

export function setSigningSecret(subscriptionId: string, secret: string) {
  signingSecrets.set(subscriptionId, secret);
}

export function removeSigningSecret(subscriptionId: string) {
  signingSecrets.delete(subscriptionId);
}

export function setGlobalSigningSecret(secret: string) {
  if (secret) {
    signingSecrets.set("_global", secret);
  } else {
    signingSecrets.delete("_global");
  }
}

function verifySignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  // Try all known secrets
  for (const secret of signingSecrets.values()) {
    if (!secret) continue;
    const expectedSig =
      "v1=" +
      crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (expectedSig.length !== signature.length) continue;
    if (
      crypto.timingSafeEqual(
        Buffer.from(expectedSig),
        Buffer.from(signature)
      )
    ) {
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-pagerduty-signature");

  // Only verify if we have signing secrets configured
  if (signingSecrets.size > 0) {
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  // Handle PagerDuty webhook event
  if (payload.event) {
    const eventType = payload.event.event_type;
    if (
      eventType === "incident.triggered" ||
      eventType === "incident.acknowledged" ||
      eventType === "incident.resolved"
    ) {
      addSSEEvent(payload);
    }
  }

  return NextResponse.json({ status: "accepted" });
}
