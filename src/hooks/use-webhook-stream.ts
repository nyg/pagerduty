"use client";

import { useEffect, useRef, useCallback } from "react";
import { useConfig } from "@/contexts/config-context";
import { useIncidents } from "@/contexts/incident-context";
import type { PagerDutyIncident, WebhookEvent } from "@/lib/types";

function webhookEventToIncident(event: WebhookEvent): PagerDutyIncident {
  const d = event.event.data;
  type IncidentWithResolver = WebhookEvent["event"]["data"] & {
    resolved_by_user?: { id: string; summary: string };
    last_status_change_by?: { id: string; summary: string };
  };
  const incidentWithResolver = d as IncidentWithResolver;
  const resolvedBy =
    incidentWithResolver.resolved_by_user ??
    incidentWithResolver.last_status_change_by;

  return {
    id: d.id,
    incident_number: d.number,
    title: d.title,
    status: d.status as PagerDutyIncident["status"],
    urgency: d.urgency as PagerDutyIncident["urgency"],
    created_at: d.created_at,
    updated_at: d.updated_at,
    html_url: d.html_url,
    service: d.service,
    assignees: d.assignees ?? [],
    resolved_by: resolvedBy,
    teams: d.teams ?? [],
  };
}

export function useWebhookStream() {
  const { isWebhookMode, config, isConfigured } = useConfig();
  const { upsertIncident, setIncidents, setLoading, setError, page } =
    useIncidents();
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial fetch when entering webhook mode
  const fetchInitial = useCallback(async () => {
    if (!isConfigured) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        teamId: config.teamId,
        apiToken: config.apiToken,
        limit: "30",
        offset: String(page * 30),
        statuses: "triggered,acknowledged,resolved",
      });
      const res = await fetch(`/api/incidents?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIncidents(data.data, data.total, data.offset);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch incidents"
      );
    }
  }, [isConfigured, config.teamId, config.apiToken, page, setIncidents, setLoading, setError]);

  useEffect(() => {
    if (!isWebhookMode) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    fetchInitial();

    const es = new EventSource("/api/webhooks/pagerduty/stream");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const webhookEvent: WebhookEvent = JSON.parse(event.data);
        const incident = webhookEventToIncident(webhookEvent);
        upsertIncident(incident);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isWebhookMode, fetchInitial, upsertIncident]);
}
