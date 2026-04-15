"use client";

import { useState, useEffect } from "react";
import { useConfig } from "@/contexts/config-context";
import type { PagerDutyAlert } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface AlertListProps {
  incidentId: string;
}

export function AlertList({ incidentId }: AlertListProps) {
  const { config } = useConfig();
  const [alerts, setAlerts] = useState<PagerDutyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ apiToken: config.apiToken });
        const res = await fetch(
          `/api/incidents/${incidentId}/alerts?${params.toString()}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setAlerts(data.alerts);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to fetch alerts"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAlerts();
    return () => {
      cancelled = true;
    };
  }, [incidentId, config.apiToken]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 pl-6 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading alerts…
      </div>
    );
  }

  if (error) {
    return <p className="py-2 pl-6 text-sm text-destructive">{error}</p>;
  }

  if (alerts.length === 0) {
    return (
      <p className="py-2 pl-6 text-sm text-muted-foreground">No alerts</p>
    );
  }

  return (
    <div className="space-y-2 py-2 pl-6">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-md border bg-muted/50 p-3 text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{alert.summary}</p>
            <Badge
              variant={
                alert.severity === "critical" ? "destructive" : "secondary"
              }
              className="shrink-0"
            >
              {alert.severity}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {alert.service.summary} ·{" "}
            {new Date(alert.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
