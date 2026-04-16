"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { RefreshCw, Loader2, AlertCircle, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIncidents } from "@/contexts/incident-context";
import { useConfig } from "@/contexts/config-context";
import { useIncidentPolling } from "@/hooks/use-incident-polling";
import { useWebhookStream } from "@/hooks/use-webhook-stream";
import { useNotifications } from "@/hooks/use-notifications";
import { StatusBadge, UrgencyBadge } from "@/components/incident-badges";
import { AlertList } from "@/components/alert-list";
import { CountdownTimer } from "@/components/countdown-timer";
import { PaginationControls } from "@/components/pagination-controls";
import { useFormatter } from "@/lib/formatter-context";
import type { PagerDutyIncident } from "@/lib/types";

const INCIDENT_TABLE_COLUMN_COUNT = 7;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function IncidentTable({
  incidents,
  expandedIds,
  toggleExpand,
  loading,
  emptyMessage,
  formatter,
}: {
  incidents: PagerDutyIncident[];
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  loading: boolean;
  emptyMessage: string;
  formatter: ReturnType<typeof useFormatter>;
}) {
  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead className="w-[160px]">Created</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead className="w-[80px]">Urgency</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Resolved by</TableHead>
          <TableHead>Title</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && incidents.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={INCIDENT_TABLE_COLUMN_COUNT}
              className="h-32 text-center"
            >
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            </TableCell>
          </TableRow>
        ) : incidents.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={INCIDENT_TABLE_COLUMN_COUNT}
              className="h-32 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          incidents.map((incident) => (
            <Fragment key={incident.id}>
              <TableRow>
                <TableCell className="w-10 px-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleExpand(incident.id)}
                  >
                    {expandedIds.has(incident.id) ? (
                      <Minus className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatter.asDateTime(incident.created_at)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={incident.status} />
                </TableCell>
                <TableCell>
                  <UrgencyBadge urgency={incident.urgency} />
                </TableCell>
                <TableCell className="text-sm">
                  {incident.service.summary}
                </TableCell>
                <TableCell className="text-sm">
                  {incident.resolved_by?.summary || "—"}
                </TableCell>
                <TableCell>
                  <a
                    href={incident.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {incident.title}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    #{incident.incident_number}
                  </p>
                </TableCell>
              </TableRow>
              {expandedIds.has(incident.id) && (
                <TableRow>
                  <TableCell
                    colSpan={INCIDENT_TABLE_COLUMN_COUNT}
                    className="bg-muted/30 p-0"
                  >
                    <AlertList incidentId={incident.id} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function IncidentDashboard() {
  const {
    incidents,
    loading,
    error,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    getNewIncidentIds,
    markNotified,
  } = useIncidents();
  const { isConfigured } = useConfig();
  const { secondsUntilRefresh, pollInterval, isPolling, refresh } =
    useIncidentPolling();
  const { notify } = useNotifications();
  const formatter = useFormatter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Connect webhook SSE stream
  useWebhookStream();

  // Notify on new incidents
  useEffect(() => {
    if (incidents.length === 0) return;
    const newIds = getNewIncidentIds(incidents);
    if (newIds.length > 0) {
      const newIncidents = incidents.filter((i) => newIds.includes(i.id));
      newIncidents.forEach(notify);
      markNotified(newIds);
    }
  }, [incidents, getNewIncidentIds, markNotified, notify]);

  const { todayIncidents, previousIncidents } = useMemo(() => {
    const today: PagerDutyIncident[] = [];
    const previous: PagerDutyIncident[] = [];
    for (const incident of incidents) {
      if (isToday(incident.created_at)) {
        today.push(incident);
      } else {
        previous.push(incident);
      }
    }
    return { todayIncidents: today, previousIncidents: previous };
  }, [incidents]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!isConfigured) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <CardHeader>
          <CardTitle>Welcome to PagerDuty Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configure your PagerDuty API token and team in the{" "}
            <a href="/settings" className="font-medium underline">
              Settings
            </a>{" "}
            page to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-4 px-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Incidents</h2>
          </div>
          <div className="flex items-center gap-3">
            <CountdownTimer
              seconds={secondsUntilRefresh}
              total={pollInterval}
              isPolling={isPolling}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Today's incidents */}
        {todayIncidents.length > 0 && (
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Today</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <IncidentTable
                incidents={todayIncidents}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                loading={loading}
                emptyMessage="No incidents today"
                formatter={formatter}
              />
            </CardContent>
          </Card>
        )}

        {/* Previous incidents */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">
              {todayIncidents.length > 0 ? "Previous" : "Incidents"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <IncidentTable
              incidents={previousIncidents}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              loading={loading}
              emptyMessage="No incidents found"
              formatter={formatter}
            />
          </CardContent>
          <PaginationControls
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </Card>
      </div>
    </TooltipProvider>
  );
}
