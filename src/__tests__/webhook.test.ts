import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock SSE clients module
const mockAddSSEEvent = vi.fn();
vi.mock(
  "@/app/api/webhooks/pagerduty/stream/clients",
  () => ({
    addSSEEvent: mockAddSSEEvent,
  })
);

// Dynamic import after mocks
const { POST, setGlobalSigningSecret } = await import(
  "@/app/api/webhooks/pagerduty/route"
);

function createRequest(body: string, signature?: string): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (signature) {
    headers["x-pagerduty-signature"] = signature;
  }
  return new Request("http://localhost/api/webhooks/pagerduty", {
    method: "POST",
    headers,
    body,
  });
}

function signPayload(body: string, secret: string): string {
  return (
    "v1=" + crypto.createHmac("sha256", secret).update(body).digest("hex")
  );
}

describe("Webhook Handler", () => {
  beforeEach(() => {
    mockAddSSEEvent.mockReset();
  });

  it("accepts valid incident.triggered event without signing secret", async () => {
    const payload = JSON.stringify({
      event: {
        id: "evt1",
        event_type: "incident.triggered",
        resource_type: "incident",
        data: {
          id: "INC1",
          title: "Server down",
          status: "triggered",
          urgency: "high",
        },
      },
    });

    const req = createRequest(payload) as unknown as import("next/server").NextRequest;
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("accepted");
    expect(mockAddSSEEvent).toHaveBeenCalledOnce();
  });

  it("rejects invalid HMAC signature when secret is configured", async () => {
    setGlobalSigningSecret("my-secret");

    const payload = JSON.stringify({
      event: { event_type: "incident.triggered" },
    });

    const req = createRequest(payload, "v1=invalidsignature") as unknown as import("next/server").NextRequest;
    const res = await POST(req);

    expect(res.status).toBe(401);

    // Clean up
    setGlobalSigningSecret("");
  });

  it("accepts valid HMAC signature", async () => {
    const secret = "test-webhook-secret";
    setGlobalSigningSecret(secret);

    const payload = JSON.stringify({
      event: {
        id: "evt2",
        event_type: "incident.acknowledged",
        resource_type: "incident",
        data: {
          id: "INC2",
          title: "Acknowledged",
          status: "acknowledged",
        },
      },
    });

    const signature = signPayload(payload, secret);
    const req = createRequest(payload, signature) as unknown as import("next/server").NextRequest;
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockAddSSEEvent).toHaveBeenCalledOnce();

    // Clean up
    setGlobalSigningSecret("");
  });

  it("returns 400 for invalid JSON", async () => {
    const req = createRequest("not json") as unknown as import("next/server").NextRequest;
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("ignores non-incident events", async () => {
    const payload = JSON.stringify({
      event: {
        id: "evt3",
        event_type: "service.created",
        resource_type: "service",
        data: {},
      },
    });

    const req = createRequest(payload) as unknown as import("next/server").NextRequest;
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockAddSSEEvent).not.toHaveBeenCalled();
  });

  it("processes incident.resolved events", async () => {
    const payload = JSON.stringify({
      event: {
        id: "evt4",
        event_type: "incident.resolved",
        resource_type: "incident",
        data: {
          id: "INC3",
          title: "Resolved",
          status: "resolved",
        },
      },
    });

    const req = createRequest(payload) as unknown as import("next/server").NextRequest;
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockAddSSEEvent).toHaveBeenCalledOnce();
  });
});
