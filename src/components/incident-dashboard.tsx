"use client";

import { Fragment, useEffect } from "react";
import { RefreshCw, Loader2, AlertCircle } from "lucide-react";
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

const INCIDENT_TABLE_COLUMN_COUNT = 7;

export function IncidentDashboard() {
  const { incidents, loading, error, total, page, setPage, getNewIncidentIds, markNotified } =
    useIncidents();
  const { isConfigured } = useConfig();
  const { secondsUntilRefresh, pollInterval, isPolling, refresh } =
    useIncidentPolling();
  const { notify } = useNotifications();

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
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Incidents</h2>
            <span className="text-sm text-muted-foreground">
              {total} total
            </span>
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
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px]">Urgency</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Resolved by</TableHead>
                <TableHead className="w-[160px]">Created</TableHead>
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
                    No incidents found
                  </TableCell>
                </TableRow>
              ) : (
                incidents.map((incident) => (
                  <Fragment key={incident.id}>
                    <TableRow>
                      <TableCell>
                        <StatusBadge status={incident.status} />
                      </TableCell>
                      <TableCell>
                        <UrgencyBadge urgency={incident.urgency} />
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
                      <TableCell className="text-sm">
                        {incident.service.summary}
                      </TableCell>
                      <TableCell className="text-sm">
                        {incident.assignees
                          ?.map((a) => a.summary)
                          .join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {incident.resolved_by?.summary || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(incident.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={INCIDENT_TABLE_COLUMN_COUNT}
                        className="pt-0"
                      >
                        <AlertList incidentId={incident.id} />
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
          <PaginationControls
            page={page}
            total={total}
            pageSize={30}
            onPageChange={setPage}
          />
        </Card>
      </div>
    </TooltipProvider>
  );
}
