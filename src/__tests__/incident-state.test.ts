import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { IncidentProvider, useIncidents } from "@/contexts/incident-context";
import type { PagerDutyIncident } from "@/lib/types";

function makeIncident(overrides: Partial<PagerDutyIncident> = {}): PagerDutyIncident {
  return {
    id: "INC1",
    incident_number: 1,
    title: "Test Incident",
    status: "triggered",
    urgency: "high",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    html_url: "https://pd.example.com/incidents/INC1",
    service: { id: "SVC1", summary: "Service 1" },
    assignees: [{ id: "USR1", summary: "User 1" }],
    teams: [{ id: "TEAM1", summary: "Team 1" }],
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(IncidentProvider, null, children);
}

describe("Incident State Manager", () => {
  it("sets incidents correctly", () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    const incidents = [makeIncident({ id: "INC1" }), makeIncident({ id: "INC2" })];

    act(() => {
      result.current.setIncidents(incidents, 2, 0);
    });

    expect(result.current.incidents).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.offset).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it("deduplicates on upsert — updates existing incident", () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    const inc = makeIncident({ id: "INC1", status: "triggered" });
    act(() => {
      result.current.setIncidents([inc], 1, 0);
    });

    const updated = makeIncident({ id: "INC1", status: "acknowledged" });
    act(() => {
      result.current.upsertIncident(updated);
    });

    expect(result.current.incidents).toHaveLength(1);
    expect(result.current.incidents[0].status).toBe("acknowledged");
  });

  it("upsert adds new incident to front", () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    const inc1 = makeIncident({ id: "INC1" });
    act(() => {
      result.current.setIncidents([inc1], 1, 0);
    });

    const inc2 = makeIncident({ id: "INC2", title: "New Incident" });
    act(() => {
      result.current.upsertIncident(inc2);
    });

    expect(result.current.incidents).toHaveLength(2);
    expect(result.current.incidents[0].id).toBe("INC2");
    expect(result.current.total).toBe(2);
  });

  it("tracks notified IDs — first load marks all as notified", () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    const incidents = [makeIncident({ id: "INC1" }), makeIncident({ id: "INC2" })];
    act(() => {
      result.current.setIncidents(incidents, 2, 0);
    });

    // Initial load — all should already be "notified" (no new IDs)
    const newIds = result.current.getNewIncidentIds(incidents);
    expect(newIds).toHaveLength(0);
  });

  it("detects new incidents on subsequent loads", () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    // Initial load
    const initial = [makeIncident({ id: "INC1" })];
    act(() => {
      result.current.setIncidents(initial, 1, 0);
    });

    // Second load with new incident
    const updated = [
      makeIncident({ id: "INC1" }),
      makeIncident({ id: "INC2" }),
    ];
    act(() => {
      result.current.setIncidents(updated, 2, 0);
    });

    const newIds = result.current.getNewIncidentIds(updated);
    expect(newIds).toEqual(["INC2"]);

    // After marking notified, no new IDs
    act(() => {
      result.current.markNotified(["INC2"]);
    });
    const afterMark = result.current.getNewIncidentIds(updated);
    expect(afterMark).toHaveLength(0);
  });

  it("manages loading state", () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });
    expect(result.current.loading).toBe(false);
  });

  it("manages error state", () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    expect(result.current.error).toBeNull();

    act(() => {
      result.current.setError("Something went wrong");
    });
    expect(result.current.error).toBe("Something went wrong");
    expect(result.current.loading).toBe(false);
  });

  it("manages page state", () => {
    const { result } = renderHook(() => useIncidents(), { wrapper });

    expect(result.current.page).toBe(0);

    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.page).toBe(2);
  });
});
