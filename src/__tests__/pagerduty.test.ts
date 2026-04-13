import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only to allow importing in test environment
vi.mock("server-only", () => ({}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
const pd = await import("@/lib/pagerduty");

describe("PagerDuty API Client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listIncidents", () => {
    it("sends correct request with team_ids and statuses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          incidents: [
            {
              id: "P1",
              title: "Test Incident",
              status: "triggered",
              urgency: "high",
            },
          ],
          limit: 30,
          offset: 0,
          total: 1,
          more: false,
        }),
      });

      const result = await pd.listIncidents("test-token", {
        teamIds: ["TEAM1"],
        statuses: ["triggered", "acknowledged"],
        limit: 30,
        offset: 0,
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("/incidents?");
      expect(url).toContain("team_ids%5B%5D=TEAM1");
      expect(url).toContain("statuses%5B%5D=triggered");
      expect(url).toContain("statuses%5B%5D=acknowledged");
      expect(url).toContain("limit=30");
      expect(url).toContain("offset=0");
      expect(init.headers).toHaveProperty(
        "Authorization",
        "Token token=test-token"
      );
      expect(init.headers).toHaveProperty(
        "Accept",
        "application/vnd.pagerduty+json;version=2"
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("P1");
      expect(result.total).toBe(1);
    });

    it("uses default limit and offset when not provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          incidents: [],
          limit: 30,
          offset: 0,
          total: 0,
          more: false,
        }),
      });

      await pd.listIncidents("test-token", {});

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("limit=30");
      expect(url).toContain("offset=0");
    });

    it("throws PagerDutyError on 401", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      await expect(
        pd.listIncidents("bad-token", { teamIds: ["T1"] })
      ).rejects.toThrow(pd.PagerDutyError);
    });

    it("throws PagerDutyError on 429 rate limit", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limited",
      });

      try {
        await pd.listIncidents("test-token", {});
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(pd.PagerDutyError);
        expect((err as InstanceType<typeof pd.PagerDutyError>).status).toBe(
          429
        );
      }
    });
  });

  describe("listAlerts", () => {
    it("fetches alerts for a specific incident", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          alerts: [
            {
              id: "A1",
              summary: "CPU High",
              severity: "critical",
              status: "triggered",
            },
          ],
        }),
      });

      const alerts = await pd.listAlerts("test-token", "INC123");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/incidents/INC123/alerts");
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe("A1");
    });
  });

  describe("listTeams", () => {
    it("paginates through all teams", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            teams: [{ id: "T1", name: "Team 1" }],
            more: true,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            teams: [{ id: "T2", name: "Team 2" }],
            more: false,
          }),
        });

      const teams = await pd.listTeams("test-token");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(teams).toHaveLength(2);
      expect(teams[0].id).toBe("T1");
      expect(teams[1].id).toBe("T2");

      // Check pagination offsets
      const [url1] = mockFetch.mock.calls[0];
      const [url2] = mockFetch.mock.calls[1];
      expect(url1).toContain("offset=0");
      expect(url2).toContain("offset=100");
    });
  });

  describe("createWebhookSubscription", () => {
    it("sends correct payload", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          webhook_subscription: {
            id: "WH1",
            delivery_method: { secret: "s3cret" },
          },
        }),
      });

      const result = await pd.createWebhookSubscription("test-token", {
        deliveryUrl: "https://example.ngrok.io/api/webhooks/pagerduty",
        teamId: "TEAM1",
      });

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("/webhook_subscriptions");
      expect(init.method).toBe("POST");

      const body = JSON.parse(init.body);
      expect(body.webhook_subscription.delivery_method.url).toBe(
        "https://example.ngrok.io/api/webhooks/pagerduty"
      );
      expect(body.webhook_subscription.filter.id).toBe("TEAM1");
      expect(body.webhook_subscription.filter.type).toBe("team_reference");
      expect(body.webhook_subscription.events).toContain(
        "incident.triggered"
      );

      expect(result.id).toBe("WH1");
      expect(result.secret).toBe("s3cret");
    });
  });

  describe("deleteWebhookSubscription", () => {
    it("sends DELETE request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await pd.deleteWebhookSubscription("test-token", "WH1");

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("/webhook_subscriptions/WH1");
      expect(init.method).toBe("DELETE");
    });
  });
});
