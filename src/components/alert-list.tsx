"use client";

import { useState } from "react";
import { useConfig } from "@/contexts/config-context";
import type { PagerDutyAlert } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AlertListProps {
  incidentId: string;
}

export function AlertList({ incidentId }: AlertListProps) {
  const { config } = useConfig();
  const [alerts, setAlerts] = useState<PagerDutyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ apiToken: config.apiToken });
      const res = await fetch(
        `/api/incidents/${incidentId}/alerts?${params.toString()}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlerts(data.alerts);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !loaded) {
      fetchAlerts();
    }
  };

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>Alerts</span>
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2 pl-5">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {loaded && alerts.length === 0 && (
            <p className="text-sm text-muted-foreground">No alerts</p>
          )}
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-md border bg-muted/50 p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{alert.summary}</p>
                <Badge
                  variant={
                    alert.severity === "critical"
                      ? "destructive"
                      : "secondary"
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
      </CollapsibleContent>
    </Collapsible>
  );
}
